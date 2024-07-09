import requests

# Defina a API Key
api_key = 'cde8f340-b849-40e7-8a9e-f39afa665559'

# URL da API groq-chat
url_groq_chat = "http://localhost:3000/api/groq-chat"

# Cabeçalhos da requisição
headers_groq_chat = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

# Dados da requisição
data_groq_chat = {
    "message": "como ganhar dinheiro??"
}

# Fazer a requisição
response_groq_chat = requests.post(url_groq_chat, headers=headers_groq_chat, json=data_groq_chat)

# Verificar a resposta
if response_groq_chat.status_code == 200:
    response_data = response_groq_chat.json()
    print(f"Resposta da API groq-chat: {response_data}")
else:
    print(f"Erro ao consumir API groq-chat: {response_groq_chat.status_code}, {response_groq_chat.text}")
