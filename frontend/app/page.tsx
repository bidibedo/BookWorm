"use client";
import { useState, useEffect } from "react";

export default function AddBook() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [press, setPress] = useState("");

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

    // fetch varsayılan olarak GET isteği atar, bu yüzden method belirtmemize gerek yok
    const response = await fetch(API_URL);
    const result = await response.json();

    // İşlem başarılıysa gelen veriyi books state'ine kaydediyoruz
    if (result.status === "success") {
      setBooks(result.data);
    }
  };

  const handleSubmit = async () => {
    // Validasyon - eğer title veya author boş ise çalışmasın
    if (!title.trim() || !author.trim() || !year.trim() || !press.trim()) {
      alert("Lütfen tüm alanları doldurunuz!");
      return;
    }
    // İstek FastAPI'nin çalıştığı yerel adrese gidiyor
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
      setTitle(""); // Kutuyu temizle
      setAuthor(""); // Kutuyu temizle
      setYear(""); // Kutuyu temizle
      setPress(""); // Kutuyu temizle
      handleView(); // Kitap listesi güncellensin
    }
  };

  // Sayfa (bileşen) yüklendiğinde handleView'ı bir kez çalıştırır
  useEffect(() => {
    handleView();
  }, []); // <-- Buradaki boş dizi [] çok önemlidir.

  return (
    <div style={{ padding: "50px" }}>
      <div
        style={{ border: "2px solid blue", margin: "20px", padding: "20px" }}
      >
        <div>
          <h1 style={{ fontWeight: "bold", fontSize: "24px", color: "blue" }}>
            Kitaplığım
          </h1>
        </div>

        <ul style={{ listStyleType: "none", padding: 0 }}>
          {books.length === 0 ? (
            <p>Kitaplar yükleniyor veya liste boş...</p>
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
                <strong>{book.title}</strong>, {book.author} ({book.year},{" "}
                {book.press})
              </li>
            ))
          )}
        </ul>
      </div>

      <div
        style={{
          border: "2px solid #bd2728",
          margin: "20px",
          padding: "20px",
        }}
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
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kitap Adı"
        />

        <h2 style={{ marginTop: "2rem", fontWeight: "bold" }}>Yazar İsmi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
          }}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Yazar Adı"
        />

        <h2 style={{ marginTop: "2rem", fontWeight: "bold" }}>Yayın Yılı</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
          }}
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Yıl"
        />

        <h2 style={{ marginTop: "2rem", fontWeight: "bold" }}>Yayınevi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
            marginRight: "10px",
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
              padding: "10px",
              color: "#bd2728",
              fontWeight: "bold",
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
