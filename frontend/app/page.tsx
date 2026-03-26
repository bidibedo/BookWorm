"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AddBook() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [press, setPress] = useState("");
  const [isbn, setIsbn] = useState(""); // ISBN için yeni state

  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false); // ISBN aranıyor animasyonu için

  interface Book {
    id: string | number;
    title: string;
    author: string;
    year: number;
    press: string;
  }

  const [books, setBooks] = useState<Book[]>([]);

  // KİTAPLARI GETİRME İŞLEMİ
  const handleView = async () => {
    const API_URL = "https://bookworm-9kaf.onrender.com/books";
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
      console.error("Veri çekilirken hata:", error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsWakingUp(false);
    }
  };

  // ISBN İLE OTOMATİK DOLDURMA İŞLEMİ (YENİ)
  const handleIsbnLookup = async () => {
    if (!isbn.trim()) {
      alert("Lütfen aramak için bir ISBN numarası girin!");
      return;
    }

    setIsFetchingIsbn(true);
    try {
      // Render'daki güncel API'mize istek atıyoruz
      const API_URL = `https://bookworm-9kaf.onrender.com/books/lookup/${isbn.trim()}`;
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.status === "success") {
        // Gelen verileri form kutucuklarına dolduruyoruz
        setTitle(result.data.title || "");
        setAuthor(result.data.author || "");
        setYear(result.data.year ? result.data.year.toString() : "");
        setPress(result.data.press || "");
      } else {
        alert(result.message || "Kitap bulunamadı.");
      }
    } catch (error) {
      console.error("ISBN sorgulama hatası:", error);
      alert("Veri çekilirken bir hata oluştu.");
    } finally {
      setIsFetchingIsbn(false);
    }
  };

  // MANUEL KİTAP EKLEME İŞLEMİ
  const handleSubmit = async () => {
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
      setIsbn(""); // Eklendikten sonra ISBN kutusunu da temizle

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
        <h1 style={{ fontWeight: "bold", fontSize: "24px", color: "blue" }}>
          Kitaplığım
        </h1>
        <ul style={{ listStyleType: "none", padding: 0, marginTop: "20px" }}>
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
                  ⏳ Sunucu uyanıyor... Bu işlem yaklaşık 50 saniye sürebilir.
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
        <h1 style={{ fontWeight: "bold", fontSize: "24px", color: "#bd2728" }}>
          Kitap Ekle
        </h1>

        {/* --- YENİ EKLENEN ISBN BÖLÜMÜ --- */}
        <div
          style={{
            backgroundColor: "#fff5f5",
            padding: "15px",
            marginTop: "15px",
            borderRadius: "8px",
            border: "1px dashed #bd2728",
          }}
        >
          <h2
            style={{ fontSize: "16px", fontWeight: "bold", color: "#bd2728" }}
          >
            ISBN ile Hızlı Ekle (Opsiyonel)
          </h2>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                color: "black",
                flex: 1,
                minWidth: "200px",
              }}
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Örn: 9789750802942"
            />
            <button
              onClick={handleIsbnLookup}
              disabled={isFetchingIsbn}
              style={{
                padding: "10px 20px",
                backgroundColor: isFetchingIsbn ? "#ccc" : "#bd2728",
                color: "white",
                border: "none",
                fontWeight: "bold",
                cursor: isFetchingIsbn ? "not-allowed" : "pointer",
              }}
            >
              {isFetchingIsbn ? "Aranıyor..." : "Otomatik Doldur"}
            </button>
          </div>
        </div>

        <hr style={{ margin: "25px 0", borderColor: "#eee" }} />

        {/* MANUEL FORM KISMI (Buradaki kutular otomatik dolacak) */}
        <h2 style={{ fontWeight: "bold" }}>Kitap İsmi</h2>
        <input
          style={{
            marginTop: "0.5rem",
            padding: "10px",
            border: "1px solid #ccc",
            color: "black",
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
            width: "100%",
            maxWidth: "300px",
          }}
          value={press}
          onChange={(e) => setPress(e.target.value)}
          placeholder="Yayınevi"
        />

        <div style={{ marginTop: "2rem" }}>
          <button
            style={{
              border: "1px solid #bd2728",
              backgroundColor: "white",
              padding: "10px 30px",
              color: "#bd2728",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={handleSubmit}
          >
            Kütüphaneye Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
