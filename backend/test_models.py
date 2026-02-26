import google.generativeai as genai

# Dán Key của bạn vào đây
genai.configure(api_key="AIzaSyC55YRFCDmRaT7Scnf6TCusxl-zu_b7Bhs")

print("--- ĐANG KIỂM TRA MODEL ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model khả dụng: {m.name}")
except Exception as e:
    print(f"Lỗi: {e}")