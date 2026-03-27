from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from pydantic import BaseModel # Gelen veriyi tutmak için eklendi
import google.generativeai as genai # Gemini kütüphanesi eklendi
import json
from typing import List # List tipini kullanabilmek için ekledik

app = FastAPI()

# Next.js'in (localhost:3000) FastAPI'ye istek atabilmesi için CORS izni veriyoruz
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Buraya kendi Supabase bilgilerini yapıştır
url: str = "https://eoylcckdsiskmkrwljym.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveWxjY2tkc2lza21rcndsanltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODA3NzksImV4cCI6MjA4OTk1Njc3OX0.AoJJjp1rST6fnuVV4mAdlSxF1Js2pSM5Zzs5dkp0yiE"
supabase: Client = create_client(url, key)

# GÜVENLİK GÖREVLİSİ FONKSİYONU (YENİ)
security = HTTPBearer()

# --- GEMINI API AYARI ---
# DİKKAT: API ANAHTARINI KODUN İÇİNDE BIRAKMA. Şimdilik test için buraya yaz, sonra Render'da çevre değişkeni (Environment Variable) yapacağız.
genai.configure(api_key="AIzaSyDr89dA4ctLpw7VUdErig7vUeDc8ouus_s")

# Gelen OCR tahminlerini yakalayacak yapı (Artık Liste alıyor)
class OCRRequest(BaseModel):
    candidates: List[str]

# GÜBÜR GÖNDERME VE TEMİZLEME UÇ NOKTASI
@app.post("/books/parse-spine")
async def parse_book_spine(request: OCRRequest):
    if not request.candidates:
        raise HTTPException(status_code=400, detail="Tahmin listesi boş olamaz.")

    try:
        model = genai.GenerativeModel('gemini-1.5-flash-002')

        # Prompt'umuzu çoklu tahmin mantığına göre güncelledik
        prompt = f"""
        Aşağıda bir kitabın sırtından okunan metin için kameranın ürettiği alternatif tahminlerin bir listesi var.
        Kamera aynı yazıyı farklı açılardan veya farklı olasılıklarla okumuş olabilir. 
        Bu alternatifleri incele, harfleri ve kelimeleri bağlamına göre birleştirerek mantıklı olan tek bir "Kitap Adı" ve "Yazar Adı" çıkar.
        
        OCR Tahminleri Listesi:
        {request.candidates}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING"},
                        "author": {"type": "STRING"}
                    },
                    "required": ["title", "author"]
                },
                temperature=0.1
            )
        )

        import json
        clean_book_data = json.loads(response.text)
        return {"status": "success", "data": clean_book_data}

    except Exception as e:
        print(f"Gemini Hatası: {e}")
        return {"status": "error", "message": f"Yapay zeka analizi başarısız oldu: {e}", "raw_text": str(request.candidates)}
    
# ... (Diğer uç noktaların GET, POST, PUT, DELETE aynı kalacak) ...

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Gelen bileti Supabase'e soruyoruz: "Bu bilet sahte mi, süresi geçmiş mi?"
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        # Bilet geçersizse 401 (Yetkisiz) hatası fırlat
        raise HTTPException(status_code=401, detail="Yetkisiz işlem: Geçersiz veya eksik bilet")

# CREATE (Oluşturma) - Artık "Depends(verify_token)" ile korunuyor
@app.post("/books")
async def create_book(title: str, author: str, year: int = 0, press: str = "", user = Depends(verify_token)):
    # Eğer kod buraya ulaştıysa, güvenlik görevlisini başarıyla geçmiş demektir
    data = supabase.table("books").insert({"title": title, "author": author, "year": year, "press": press}).execute()
    return {"status": "success", "data": data.data}

@app.get("/books")
async def get_books():
    data = supabase.table("books").select("*").execute()
    return {"status": "success", "data": data.data}

    # Mevcut kodlarının altına eklenecek

@app.get("/books/{book_id}")
async def get_book(book_id: int):
    # .eq("id", book_id) kısmı, veritabanında id'si bizim gönderdiğimiz id'ye eşit olanı filtreler
    data = supabase.table("books").select("*").eq("id", book_id).execute()
    
    # Eğer o ID'ye ait kitap yoksa boş döner
    if len(data.data) == 0:
        return {"status": "error", "message": "Kitap bulunamadı"}
        
    # Gelen listenin ilk (ve tek) elemanını döndürüyoruz
    return {"status": "success", "data": data.data[0]}

# UPDATE (Güncelleme) - Güvenlik eklendi
@app.put("/books/{book_id}")
async def update_book(book_id: int, title: str, author: str, year: int = 0, press: str = "", user = Depends(verify_token)):
    data = supabase.table("books").update({
        "title": title, 
        "author": author, 
        "year": year, 
        "press": press
    }).eq("id", book_id).execute()
    
    return {"status": "success", "data": data.data}

# DELETE (Silme) - Güvenlik eklendi
@app.delete("/books/{book_id}")
async def delete_book(book_id: int, user = Depends(verify_token)):
    data = supabase.table("books").delete().eq("id", book_id).execute()
    return {"status": "success", "data": data.data}

# KİTAP BİLGİSİ ÇEKME (Çift Motorlu: Google Books + OpenLibrary)
@app.get("/books/lookup/{isbn}")
async def lookup_isbn(isbn: str):
    async with httpx.AsyncClient() as client:
        
        # --- 1. MOTOR: GOOGLE BOOKS API ---
        google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        try:
            g_response = await client.get(google_url)
            g_data = g_response.json()
            
            if "items" in g_data:
                vol = g_data["items"][0]["volumeInfo"]
                
                # Yılı güvenli bir şekilde çekelim (Örn: "2021-05-12" -> 2021)
                pub_date = vol.get("publishedDate", "")
                year = int(pub_date[:4]) if len(pub_date) >= 4 and pub_date[:4].isdigit() else 0
                
                return {
                    "status": "success",
                    "source": "Google Books",
                    "data": {
                        "title": vol.get("title", ""),
                        "author": vol.get("authors", [""])[0] if vol.get("authors") else "",
                        "year": year,
                        "press": vol.get("publisher", "")
                    }
                }
        except Exception as e:
            print(f"Google API Hatası: {e}")
            # Hata olursa kodu durdurma, OpenLibrary'e geç

        # --- 2. MOTOR: OPENLIBRARY API (Yedek) ---
        ol_url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data"
        try:
            ol_response = await client.get(ol_url)
            ol_data = ol_response.json()
            ol_key = f"ISBN:{isbn}"
            
            if ol_key in ol_data:
                book = ol_data[ol_key]
                
                # OpenLibrary yazarları ve yayınevlerini liste içinde sözlük olarak tutar
                authors = book.get("authors", [{"name": ""}])
                author_name = authors[0].get("name", "") if authors else ""
                
                publishers = book.get("publishers", [{"name": ""}])
                press_name = publishers[0].get("name", "") if publishers else ""
                
                # Yıl formatı bazen "Oct 12, 2001" bazen "2001" olabilir, son 4 haneyi alıyoruz
                pub_date = book.get("publish_date", "0")
                year_str = pub_date[-4:]
                year = int(year_str) if year_str.isdigit() else 0

                return {
                    "status": "success",
                    "source": "OpenLibrary",
                    "data": {
                        "title": book.get("title", ""),
                        "author": author_name,
                        "year": year,
                        "press": press_name
                    }
                }
        except Exception as e:
            print(f"OpenLibrary API Hatası: {e}")

    # İki motor da bulamazsa bu hata mesajını döndür
    return {"status": "error", "message": "Bu ISBN numarasına ait kitap hiçbir veritabanında bulunamadı."}

# GECİCİ DEDEKTİF UÇ NOKTASI (Adresi kök dizine taşıdık)
@app.get("/list-models")
async def list_available_models():
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        return {"status": "success", "available_models": available_models}
    except Exception as e:
        return {"status": "error", "message": str(e)}