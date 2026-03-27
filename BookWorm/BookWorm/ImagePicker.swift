import SwiftUI

// SwiftUI için klasik iOS kamerasını çağıran köprü
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) var presentationMode

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera // Kamerayı fotoğraf çekme modunda aç
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            // Çekilen fotoğrafı al ve ana ekrana gönder
            if let uiImage = info[.originalImage] as? UIImage {
                parent.image = uiImage
            }
            // Kamera ekranını kapat
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
