"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AddBook() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [press, setPress] = useState("");

  // Yüklenme durumlarını takip etmek için iki yeni state eklendi
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);

  interface Book {
    id: string | number;
    title: string;
    author: string;
    year: number;
    press: string;
  }

  const [books, setBooks] = useState<Book[]>([]);

  const handleView = async () => {
    const API_URL = "https://bookworm-9kaf.onrender.com/books";

    // İstek 3 saniyeden uzun sürerse isWakingUp state'ini true yapıyoruz
    const timeoutId = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);

    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.status === "success") {
        setBooks(result.data);
      }
    } catch (error) {
      console.error("Veri çekilirken hata oluştu:", error);
    } finally {
      // İşlem bitince yükleme ekranlarını kapatıyoruz
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsWakingUp(false);
    }
  };

  const handleSubmit = async () => {
    // Validasyon
    if (!title.trim() || !author.trim() || !year.trim() || !press.trim()) {
      alert("Lütfen tüm alanları doldurunuz!");
      return;
    }

    const API_URL = "https://bookworm-9kaf.onrender.com/books";

    const response = await fetch(
      `${API_URL}?title=${title}&author=${author}&year=${year}&press=${press}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();
    if (result.status === "success") {
      alert("Kitap başarıyla eklendi!");
      setTitle("");
      setAuthor("");
      setYear("");
      setPress("");

      // Yeni kitap eklendikten sonra listeyi güncellerken de "yükleniyor" animasyonunu tetikleyebiliriz
      setIsLoading(true);
      handleView();
    }
  };

  useEffect(() => {
    handleView();
  }, []);

  return (
    <div style={{ padding: "50px" }}>
      {/* KİTAPLIK BÖLÜMÜ */}
      <div
        style={{ border: "2px solid blue", margin: "20px", padding: "20px" }}
      >
        <div>
          <h1 style={{ fontWeight: "bold", fontSize: "24px", color: "blue" }}>
            Kitaplığım
          </h1>
        </div>

        <ul style={{ listStyleType: "none", padding: 0, marginTop: "20px" }}>
          {/* Yüklenme durumu kontrolü eklendi */}
          {isLoading ? (
            <div
              style={{
                padding: "15px",
                backgroundColor: "#e6f2ff",
                borderRadius: "8px",
                color: "blue",
              }}
            >
              {isWakingUp ? (
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  ⏳ Sunucu uykudan uyanıyor... Bu işlem yaklaşık 50 saniye
                  sürebilir, lütfen bekleyiniz.
                </p>
              ) : (
                <p style={{ margin: 0 }}>Kitaplar yükleniyor...</p>
              )}
            </div>
          ) : books.length === 0 ? (
            <p>Liste boş, henüz kitap eklenmemiş.</p>
          ) : (
            books.map((book) => (
              <li
                key={book.id}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #ccc",
                  marginBottom: "10px",
                }}
              >
                {/* Kullanıcı buraya tıkladığında /books/1, /books/2 gibi adreslere gidecek */}
                <Link
                  href={`/books/${book.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <strong>{book.title}</strong>, {book.author} ({book.year},{" "}
                  {book.press})
                  <span
                    style={{ float: "right", color: "blue", fontSize: "12px" }}
                  >
                    Detay &rarr;
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* KİTAP EKLE BÖLÜMÜ */}
      <div
        style={{ border: "2px solid #bd2728", margin: "20px", padding: "20px" }}
      >
        <div>
          <h1
            style={{ fontWeight: "bold", fontSize: "24px", color: "#bd2728" }}
          >
            Kitap Ekle
          </h1>
        </div>

        <h2 style={{ marginTop: "1rem", fontWeight: "bold" }}>Kitap İsmi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
            width: "100%",
            maxWidth: "300px",
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kitap Adı"
        />

        <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>Yazar İsmi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
            width: "100%",
            maxWidth: "300px",
          }}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Yazar Adı"
        />

        <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>Yayın Yılı</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
            width: "100%",
            maxWidth: "300px",
          }}
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Yıl"
        />

        <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>Yayınevi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
            width: "100%",
            maxWidth: "300px",
          }}
          value={press}
          onChange={(e) => setPress(e.target.value)}
          placeholder="Yayınevi"
        />

        <div>
          <button
            style={{
              marginTop: "2rem",
              border: "1px solid #bd2728",
              backgroundColor: "white",
              padding: "10px 20px",
              color: "#bd2728",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={handleSubmit}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
