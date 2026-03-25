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
  const params = useParams(); // URL'deki [id] kısmını yakalar
  const router = useRouter(); // Sayfalar arası geçiş (Geri dön butonu) için

  const id = params.id;

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        // Kendi Render linkinin sonuna URL'den gelen id'yi ekliyoruz
        const API_URL = `https://bookworm-9kaf.onrender.com/books/${id}`;
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.status === "success") {
          setBook(result.data);
        }
      } catch (error) {
        console.error("Kitap detayı çekilirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBookDetail();
    }
  }, [id]);

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
        <h1 style={{ color: "green", fontSize: "32px", fontWeight: "bold" }}>
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

        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "white",
            border: "2px solid green",
            color: "green",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
        >
          &larr; Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
