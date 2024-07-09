import requests


access_token = "d4e83d25-c6ef-43f1-9ea5-f0ddd5d44da5"
print(f"Access Token gerado: {access_token}")

# URL da API groq-chat
url_groq_chat = "http://localhost:3000/api/groq-chat"

# Cabeçalhos da solicitação para a API groq-chat
headers_groq_chat = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Dados da solicitação para a API groq-chat
data_groq_chat = {
    "message": "vamos falar em pt-br"
}

# Fazendo a solicitação POST para a API groq-chat
response_groq_chat = requests.post(url_groq_chat, headers=headers_groq_chat, json=data_groq_chat)

# Verificando a resposta da API groq-chat
if response_groq_chat.status_code == 200:
    response_data = response_groq_chat.json()
    print(f"Resposta da API groq-chat: {response_data}")
else:
    print(f"Erro ao consumir API groq-chat: {response_groq_chat.status_code}, {response_groq_chat.text}")

