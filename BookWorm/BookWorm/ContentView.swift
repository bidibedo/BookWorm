import SwiftUI
import Vision

struct ContentView: View {
    @State private var showCamera = false
    @State private var capturedImage: UIImage?
    @State private var recognizedText = "Henüz kitap taranmadı."
    @State private var isProcessing = false // Okuma işlemi sürüyor mu?

    var body: some View {
        VStack(spacing: 20) {
            Text("BookWorm Tarayıcı")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding(.top)

            // FOTOĞRAF GÖSTERİM ALANI
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

            // OKUNAN METİN VEYA YÜKLEME EKRANI
            if isProcessing {
                ProgressView("Yapay Zeka Metni Okuyor...")
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

            // KAMERAYI AÇMA BUTONU
            Button(action: {
                showCamera = true
            }) {
                Text("Kitap Sırtını Çek ve Oku")
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
        // showCamera true olunca kamerayı tam ekran (sheet) aç
        .sheet(isPresented: $showCamera) {
            ImagePicker(image: $capturedImage)
        }
        // capturedImage (fotoğraf) değiştiğinde hemen okuma işlemini başlat
        .onChange(of: capturedImage) { newImage in
            if let img = newImage {
                recognizeText(from: img)
            }
        }
    }

    // YÜKSEK ÇÖZÜNÜRLÜKLÜ FOTOĞRAFTAN METİN OKUMA MANTIĞI
    func recognizeText(from image: UIImage) {
        isProcessing = true
        recognizedText = ""

        // Resmi Vision'ın anlayacağı formata (cgImage) çevir
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

            var fullText = ""
            for observation in observations {
                guard let topCandidate = observation.topCandidates(1).first else { continue }
                // Artık tek harf filtresine gerek yok çünkü fotoğraf sabit, direkt ekle
                fullText += topCandidate.string + " "
            }

            DispatchQueue.main.async {
                self.recognizedText = fullText.trimmingCharacters(in: .whitespacesAndNewlines)
                self.isProcessing = false
            }
        }

        request.recognitionLevel = .accurate // En hassas seviyede oku
        request.usesLanguageCorrection = false

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        // İşlemi arka planda yap ki ekran donmasın
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
}
