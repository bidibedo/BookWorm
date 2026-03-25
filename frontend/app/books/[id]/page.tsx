"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Book {
  id: string | number;
  title: string;
  author: string;
  year: number;
  press: string;
}

export default function BookDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Düzenleme modu state'leri
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editPress, setEditPress] = useState("");

  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        const API_URL = `https://bookworm-9kaf.onrender.com/books/${id}`;
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.status === "success") {
          setBook(result.data);
          // Form alanlarını mevcut veritabanı verileriyle doldur
          setEditTitle(result.data.title);
          setEditAuthor(result.data.author);
          setEditYear(result.data.year?.toString() || "");
          setEditPress(result.data.press || "");
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchBookDetail();
  }, [id]);

  // SİLME İŞLEMİ (DELETE)
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Bu kitabı silmek istediğinize emin misiniz?",
    );
    if (!confirmDelete) return; // Kullanıcı vazgeçerse işlemi durdur

    try {
      const API_URL = `https://bookworm-9kaf.onrender.com/books/${id}`;
      const response = await fetch(API_URL, { method: "DELETE" });
      const result = await response.json();

      if (result.status === "success") {
        alert("Kitap başarıyla silindi.");
        router.push("/"); // İşlem bitince ana sayfaya dön
      }
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  // GÜNCELLEME İŞLEMİ (PUT)
  const handleUpdate = async () => {
    try {
      const API_URL = `https://bookworm-9kaf.onrender.com/books/${id}?title=${editTitle}&author=${editAuthor}&year=${editYear}&press=${editPress}`;
      const response = await fetch(API_URL, { method: "PUT" });
      const result = await response.json();

      if (result.status === "success") {
        alert("Kitap güncellendi!");
        setBook(result.data[0]); // Ekranda görünen veriyi yenisiyle değiştir
        setIsEditing(false); // Düzenleme modunu kapat
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  if (isLoading)
    return <div style={{ padding: "50px" }}>Detaylar yükleniyor...</div>;
  if (!book) return <div style={{ padding: "50px" }}>Kitap bulunamadı!</div>;

  return (
    <div style={{ padding: "50px", maxWidth: "600px" }}>
      <div
        style={{
          border: "2px solid green",
          padding: "30px",
          borderRadius: "10px",
          backgroundColor: "#f9fbf9",
        }}
      >
        {/* EĞER DÜZENLEME MODUNDA DEĞİLSEK (GÖRÜNTÜLEME EKRANI) */}
        {!isEditing ? (
          <>
            <h1
              style={{ color: "green", fontSize: "32px", fontWeight: "bold" }}
            >
              {book.title}
            </h1>
            <hr style={{ margin: "15px 0", borderColor: "lightgreen" }} />
            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
              <strong>Yazar:</strong> {book.author}
            </h2>
            <p style={{ fontSize: "18px", marginBottom: "10px" }}>
              <strong>Yayın Yılı:</strong> {book.year}
            </p>
            <p style={{ fontSize: "18px", marginBottom: "20px" }}>
              <strong>Yayınevi:</strong> {book.press}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => router.push("/")}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  border: "2px solid gray",
                  borderRadius: "5px",
                }}
              >
                &larr; Geri
              </button>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  backgroundColor: "blue",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Düzenle
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Sil
              </button>
            </div>
          </>
        ) : (
          /* EĞER DÜZENLEME MODUNDAYSAK (FORM EKRANI) */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <h2
              style={{
                color: "blue",
                marginBottom: "15px",
                fontWeight: "bold",
              }}
            >
              Kitabı Düzenle
            </h2>

            <label style={{ fontWeight: "bold" }}>Kitap Adı</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                color: "black",
              }}
            />

            <label style={{ fontWeight: "bold", marginTop: "10px" }}>
              Yazar
            </label>
            <input
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                color: "black",
              }}
            />

            <label style={{ fontWeight: "bold", marginTop: "10px" }}>
              Yayın Yılı
            </label>
            <input
              type="number"
              value={editYear}
              onChange={(e) => setEditYear(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                color: "black",
              }}
            />

            <label style={{ fontWeight: "bold", marginTop: "10px" }}>
              Yayınevi
            </label>
            <input
              value={editPress}
              onChange={(e) => setEditPress(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                color: "black",
              }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  backgroundColor: "white",
                  border: "2px solid gray",
                  borderRadius: "5px",
                }}
              >
                İptal
              </button>
              <button
                onClick={handleUpdate}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
