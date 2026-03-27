import SwiftUI
import Vision

struct ContentView: View {
    @State private var showCamera = false
    @State private var capturedImage: UIImage?
    
    // Ekranda göstereceğimiz sonuç metni
    @State private var recognizedText = "Henüz kitap taranmadı."
    @State private var isProcessing = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("BookWorm AI")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding(.top)
            
            if let image = capturedImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 350)
                    .cornerRadius(15)
                    .shadow(radius: 5)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 350)
                    .cornerRadius(15)
                    .overlay(Text("Kamera Görüntüsü").foregroundColor(.gray))
            }
            
            if isProcessing {
                ProgressView("Gemini AI Analiz Ediyor...")
                    .padding()
            } else {
                ScrollView {
                    Text(recognizedText)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                }
                .frame(maxHeight: 150)
                .background(Color.white)
                .cornerRadius(10)
                .shadow(radius: 2)
                .padding(.horizontal)
            }
            
            Spacer()
            
            Button(action: {
                showCamera = true
            }) {
                Text("Kitap Sırtını Çek ve Analiz Et")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .cornerRadius(15)
            }
            .padding()
            .padding(.bottom, 20)
        }
        .sheet(isPresented: $showCamera) {
            ImagePicker(image: $capturedImage)
        }
        .onChange(of: capturedImage) { newImage in
            if let img = newImage {
                recognizeText(from: img)
            }
        }
    }
    
    // 1. AŞAMA: VİSION İLE FOTOĞRAFTAN OLASILIKLARI ÇIKARMA
    func recognizeText(from image: UIImage) {
        isProcessing = true
        recognizedText = "Görüntü okunuyor..."
        
        guard let cgImage = image.cgImage else {
            recognizedText = "Görüntü işlenemedi."
            isProcessing = false
            return
        }
        
        let request = VNRecognizeTextRequest { request, error in
            guard let observations = request.results as? [VNRecognizedTextObservation] else {
                DispatchQueue.main.async {
                    self.recognizedText = "Metin bulunamadı."
                    self.isProcessing = false
                }
                return
            }
            
            var allCandidates: [String] = []
            
            // Senin o harika fikrin: Sadece 1 değil, en iyi 5 ihtimali alıyoruz!
            for observation in observations {
                let candidates = observation.topCandidates(5)
                for candidate in candidates {
                    if candidate.string.count > 2 { // Çok kısa gürültüleri ele
                        allCandidates.append(candidate.string)
                    }
                }
            }
            
            // Eğer hiç kelime bulamadıysa işlemi bitir
            if allCandidates.isEmpty {
                DispatchQueue.main.async {
                    self.recognizedText = "Okunabilir bir metin bulunamadı."
                    self.isProcessing = false
                }
                return
            }
            
            // 2. AŞAMA: BULUNAN TÜM İHTİMALLERİ GEMINI'YE GÖNDER
            self.sendToBackendForAI(candidates: allCandidates)
        }
        
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try handler.perform([request])
            } catch {
                DispatchQueue.main.async {
                    self.recognizedText = "Okuma hatası: \(error.localizedDescription)"
                    self.isProcessing = false
                }
            }
        }
    }
    
    // 3. AŞAMA: RENDER SUNUCUSUNA (FASTAPI) İSTEK ATMA
    func sendToBackendForAI(candidates: [String]) {
        DispatchQueue.main.async {
            self.recognizedText = "Gemini AI verileri birleştiriyor..."
            self.isProcessing = true
        }
        
        // Kendi Render adresimiz
        guard let url = URL(string: "https://bookworm-9kaf.onrender.com/books/parse-spine") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["candidates": candidates]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            
            // SİHİRLİ KOD: Bu blok, bu işlem bittiğinde ne olursa olsun çalışır ve yükleme ekranını kapatır!
            defer {
                DispatchQueue.main.async {
                    self.isProcessing = false
                }
            }
            
            // 1. İhtimal: İnternet koptu veya sunucuya hiç ulaşılamadı
            if let error = error {
                DispatchQueue.main.async {
                    self.recognizedText = "Bağlantı Hatası: \(error.localizedDescription)"
                }
                return
            }
            
            // 2. İhtimal: Sunucudan boş veri geldi
            guard let data = data else {
                DispatchQueue.main.async {
                    self.recognizedText = "Sunucudan boş veri geldi."
                }
                return
            }
            
            // 3. İhtimal: Gelen veriyi okuma ve ekrana basma
            do {
                if let jsonResponse = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                    
                    // İşlem BAŞARILIYSA
                    if let status = jsonResponse["status"] as? String, status == "success",
                       let bookData = jsonResponse["data"] as? [String: Any] {
                        
                        let title = bookData["title"] as? String ?? "Bilinmeyen Kitap"
                        let author = bookData["author"] as? String ?? "Bilinmeyen Yazar"
                        
                        DispatchQueue.main.async {
                            self.recognizedText = "📖 \(title)\n✍️ \(author)"
                        }
                    }
                    // İşlemde YAPAY ZEKA HATASI varsa (Örn: API Key yanlış)
                    else if let status = jsonResponse["status"] as? String, status == "error" {
                        let backendMessage = jsonResponse["message"] as? String ?? "Bilinmeyen hata"
                        DispatchQueue.main.async {
                            self.recognizedText = "Backend Hatası:\n\(backendMessage)"
                        }
                    }
                    // Beklenmeyen bir JSON formatıysa
                    else {
                        DispatchQueue.main.async {
                            self.recognizedText = "Beklenmeyen Format: \(jsonResponse)"
                        }
                    }
                } else {
                    DispatchQueue.main.async {
                        self.recognizedText = "Gelen veri JSON değildi."
                    }
                }
            }
            // 4. İhtimal: Sunucu JSON değil, tamamen saçma bir hata döndürdü (Örn: 500 Server Error)
            catch {
                let rawString = String(data: data, encoding: .utf8) ?? "Bozuk Veri"
                DispatchQueue.main.async {
                    self.recognizedText = "Sistem Hatası:\n\(rawString)"
                }
            }
        }.resume()
    }
}
