from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

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

@app.post("/books")
async def create_book(title: str, author: str, year: int, press: str):
    data = supabase.table("books").insert({"title": title, "author": author, "year": year, "press":press}).execute()
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

# UPDATE (Güncelleme) - PUT metodu kullanılır
@app.put("/books/{book_id}")
async def update_book(book_id: int, title: str, author: str, year: int = 0, press: str = ""):
    data = supabase.table("books").update({
        "title": title, 
        "author": author, 
        "year": year, 
        "press": press
    }).eq("id", book_id).execute()
    
    return {"status": "success", "data": data.data}

# DELETE (Silme) - DELETE metodu kullanılır
@app.delete("/books/{book_id}")
async def delete_book(book_id: int):
    data = supabase.table("books").delete().eq("id", book_id).execute()
    return {"status": "success", "data": data.data}