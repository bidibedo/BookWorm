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
        }

        // Kendi Render adresini buraya yazdık
        guard let url = URL(string: "https://bookworm-9kaf.onrender.com/books/parse-spine") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Veriyi JSON formatına çeviriyoruz {"candidates": ["...", "..."]}
        let body: [String: Any] = ["candidates": candidates]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    self.recognizedText = "Sunucu Hatası: \(error.localizedDescription)"
                    self.isProcessing = false
                }
                return
            }

            guard let data = data else { return }

            // Backend'den gelen JSON'ı çözümlüyoruz
            do {
                if let jsonResponse = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let status = jsonResponse["status"] as? String, status == "success",
                   let bookData = jsonResponse["data"] as? [String: String] {
                    
                    let title = bookData["title"] ?? "Bilinmeyen Kitap"
                    let author = bookData["author"] ?? "Bilinmeyen Yazar"
                    
                    DispatchQueue.main.async {
                        // YAPAY ZEKA BAŞARIYLA ÇÖZDÜ! Ekrana gururla yazdırıyoruz.
                        self.recognizedText = "📖 \(title)\n✍️ \(author)"
                        self.isProcessing = false
                    }
                } else {
                    DispatchQueue.main.async {
                        self.recognizedText = "AI veriyi anlamlandıramadı."
                        self.isProcessing = false
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.recognizedText = "Yanıt çözümlenemedi."
                    self.isProcessing = false
                }
            }
        }.resume()
    }
}
