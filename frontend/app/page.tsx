"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../utils/supabase"; // Az önce oluşturduğumuz köprü

export default function AddBook() {
  // --- KİTAP STATE'LERİ ---
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [press, setPress] = useState("");
  const [isbn, setIsbn] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);

  // --- KİMLİK DOĞRULAMA (AUTH) STATE'LERİ ---
  const [session, setSession] = useState<any>(null); // Kullanıcının biletini tutar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  interface Book {
    id: string | number;
    title: string;
    author: string;
    year: number;
    press: string;
  }
  const [books, setBooks] = useState<Book[]>([]);

  // 1. SİSTEM BAŞLADIĞINDA OTURUMU VE KİTAPLARI KONTROL ET
  useEffect(() => {
    // Kitapları getir
    handleView();

    // Supabase'den aktif bir oturum var mı diye sor
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Kullanıcı giriş/çıkış yaptığında burası otomatik tetiklenir
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. GİRİŞ YAPMA FONKSİYONU
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("Giriş başarısız: " + error.message);
    else alert("Başarıyla giriş yapıldı!");
  };

  // 3. ÇIKIŞ YAPMA FONKSİYONU
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleView = async () => {
    const API_URL = "https://bookworm-9kaf.onrender.com/books";
    const timeoutId = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success") setBooks(result.data);
    } catch (error) {
      console.error("Veri çekilirken hata:", error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsWakingUp(false);
    }
  };

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) return alert("Lütfen bir ISBN girin!");
    setIsFetchingIsbn(true);
    try {
      const response = await fetch(
        `https://bookworm-9kaf.onrender.com/books/lookup/${isbn.trim()}`,
      );
      const result = await response.json();
      if (result.status === "success") {
        setTitle(result.data.title || "");
        setAuthor(result.data.author || "");
        setYear(result.data.year ? result.data.year.toString() : "");
        setPress(result.data.press || "");
      } else alert(result.message);
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setIsFetchingIsbn(false);
    }
  };

  // SADECE handleSubmit FONKSİYONUNU GÜNCELLİYORUZ
  const handleSubmit = async () => {
    if (!title.trim() || !author.trim() || !year.trim() || !press.trim()) {
      return alert("Lütfen tüm alanları doldurunuz!");
    }

    // GÜVENLİK KONTROLÜ: Oturum yoksa veya bilet alınamadıysa işlemi durdur
    if (!session || !session.access_token) {
      return alert(
        "Hata: Oturum biletiniz bulunamadı. Lütfen tekrar giriş yapın.",
      );
    }

    const response = await fetch(
      `https://bookworm-9kaf.onrender.com/books?title=${title}&author=${author}&year=${year}&press=${press}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // İŞTE BİLETİ BURADA GÖNDERİYORUZ (Bearer: Taşıyıcı anlamına gelir)
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    // Eğer arka uçtan 401 hatası (Yetkisiz) dönerse
    if (response.status === 401) {
      return alert("Yetkiniz reddedildi. Oturumunuzun süresi dolmuş olabilir.");
    }

    const result = await response.json();
    if (result.status === "success") {
      alert("Kitap eklendi!");
      setTitle("");
      setAuthor("");
      setYear("");
      setPress("");
      setIsbn("");
      setIsLoading(true);
      handleView();
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      {/* KİTAPLIK BÖLÜMÜ (HERKESE AÇIK) */}
      <div
        style={{ border: "2px solid blue", margin: "20px", padding: "20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontWeight: "bold", fontSize: "24px", color: "blue" }}>
            Kitaplığım
          </h1>
          {/* Oturum açıksa Çıkış Yap butonu göster */}
          {session && (
            <button
              onClick={handleLogout}
              style={{
                padding: "5px 15px",
                backgroundColor: "#f4f4f4",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              Çıkış Yap
            </button>
          )}
        </div>

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
                  ⏳ Sunucu uyanıyor...
                </p>
              ) : (
                <p style={{ margin: 0 }}>Kitaplar yükleniyor...</p>
              )}
            </div>
          ) : books.length === 0 ? (
            <p>Liste boş.</p>
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

      {/* YÖNETİM BÖLÜMÜ (ŞARTLI GÖRÜNÜM) */}
      <div
        style={{ border: "2px solid #bd2728", margin: "20px", padding: "20px" }}
      >
        {session ? (
          // EĞER KULLANICI GİRİŞ YAPMIŞSA KİTAP EKLE FORMUNU GÖSTER
          <>
            <h1
              style={{ fontWeight: "bold", fontSize: "24px", color: "#bd2728" }}
            >
              Kitap Ekle
            </h1>
            {/* ISBN BÖLÜMÜ */}
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
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#bd2728",
                }}
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
                    cursor: isFetchingIsbn ? "not-allowed" : "pointer",
                  }}
                >
                  {isFetchingIsbn ? "Aranıyor..." : "Otomatik Doldur"}
                </button>
              </div>
            </div>
            <hr style={{ margin: "25px 0", borderColor: "#eee" }} />
            {/* MANUEL FORM */}
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
            />
            <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>
              Yazar İsmi
            </h2>
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
            />
            <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>
              Yayın Yılı
            </h2>
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
            />
            <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>
              Yayınevi
            </h2>
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
          </>
        ) : (
          // EĞER KULLANICI GİRİŞ YAPMAMIŞSA SADECE GİRİŞ FORMUNU GÖSTER
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "300px",
            }}
          >
            <h1
              style={{
                fontWeight: "bold",
                fontSize: "24px",
                color: "#bd2728",
                marginBottom: "15px",
              }}
            >
              Yönetici Girişi
            </h1>
            <p
              style={{ marginBottom: "15px", fontSize: "14px", color: "gray" }}
            >
              Kitap eklemek veya düzenlemek için giriş yapmalısınız.
            </p>
            <input
              style={{
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                color: "black",
              }}
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={{
                padding: "10px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                color: "black",
              }}
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleLogin}
              style={{
                padding: "10px",
                backgroundColor: "#bd2728",
                color: "white",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Giriş Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
