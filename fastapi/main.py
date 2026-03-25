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