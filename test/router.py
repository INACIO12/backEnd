import requests

# URL para gerar o access token
url_generate_token = "http://localhost:3000/generate-access-token"

# Token JWT obtido após login
token_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImlhdCI6MTcyMDM1MDY0MywiZXhwIjoxNzIwMzU0MjQzfQ.v1rXm52LaHMkKoxY91IQXZ5mJITfv6fnfKqeMVKd0UI"

# Cabeçalhos da solicitação para gerar o access token
headers_generate_token = {
    "Authorization": f"Bearer {token_jwt}"
}

# Fazendo a solicitação POST para gerar o access token
response_generate_token = requests.post(url_generate_token, headers=headers_generate_token)

# Verificando a resposta
if response_generate_token.status_code == 200:
    access_token = response_generate_token.json().get('token')
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

else:
    print(f"Erro ao gerar Access Token: {response_generate_token.status_code}, {response_generate_token.text}")
