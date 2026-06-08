# 🍝 Labatuti — Sistema de Restaurante Italiano

> Sistema completo de pedidos online para dark kitchen italiana, desenvolvido com Angular e Firebase.

🌐 **Acesse o projeto:** https://labatuti-192d2.web.app

---

## 📖 Sobre o Projeto

O **Labatuti** é um sistema web desenvolvido como projeto acadêmico do curso de **Tecnólogo em Análise e Desenvolvimento de Sistemas (ADS)**.

A aplicação simula o funcionamento completo de uma **dark kitchen italiana**, permitindo o gerenciamento de pedidos em tempo real desde a realização da compra pelo cliente até a confirmação da entrega.

O sistema foi desenvolvido utilizando **Angular 19**, **Firebase Authentication**, **Cloud Firestore** e **Firebase Hosting**, proporcionando uma experiência moderna, responsiva e integrada.

---

## 🚀 Funcionalidades

### 👤 Cliente

* Visualização do cardápio por categorias
* Destaque para o prato do dia com desconto
* Carrinho de compras com controle de quantidade
* Checkout em múltiplas etapas
* Aplicação de cupons de desconto
* Acompanhamento do pedido em tempo real
* Visualização do código de confirmação de entrega
* Avaliação do pedido e do entregador

### 🍳 Cozinha

* Painel de pedidos em tempo real
* Atualização do status dos pedidos
* Controle de estoque
* Alertas de validade dos produtos
* Cadastro e gerenciamento de fornecedores
* Comparativo de preços entre fornecedores

### 🛵 Entregador

* Visualização de pedidos prontos para retirada
* Controle de entregas em andamento
* Confirmação da entrega através de código de segurança
* Histórico de entregas concluídas
* Contadores de pedidos por status

### 🔧 Administrador

* Dashboard geral do sistema
* Gerenciamento de cardápio
* Cadastro e edição de pratos
* Controle de categorias
* Definição do prato do dia
* Gerenciamento de pedidos
* Cadastro e gerenciamento de cupons

---

## 🏆 Diferenciais do Projeto

* Atualização em tempo real utilizando Cloud Firestore
* Sistema de cupons de desconto
* Controle de estoque integrado
* Comparativo de fornecedores
* Código de confirmação de entrega
* Avaliação pós-entrega
* Dashboard administrativo completo
* Prato do dia com desconto automático
* Interface responsiva para diferentes perfis de usuários

---

## 🏗️ Arquitetura do Sistema

```text
Cliente / Funcionários
          ↓
      Angular 19
          ↓
   Angular Signals
          ↓
 Firebase Authentication
          ↓
    Cloud Firestore
          ↓
   Firebase Hosting
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia              | Versão | Finalidade                   |
| ----------------------- | ------ | ---------------------------- |
| Angular                 | 19+    | Desenvolvimento Frontend     |
| TypeScript              | 5+     | Linguagem principal          |
| Angular Signals         | 19+    | Gerenciamento de estado      |
| Firebase Authentication | 10+    | Autenticação                 |
| Cloud Firestore         | 10+    | Banco de dados em tempo real |
| Firebase Hosting        | -      | Hospedagem                   |
| HTML5                   | -      | Estrutura                    |
| CSS3                    | -      | Estilização                  |

---

## 📸 Capturas de Tela

> Adicione aqui imagens das principais telas do sistema.

### Tela Inicial

```md
![Home](docs/home.png)
```

### Área do Cliente

```md
![Cliente](docs/cliente.png)
```

### Área da Cozinha

```md
![Cozinha](docs/cozinha.png)
```

### Área do Entregador

```md
![Entregador](docs/entregador.png)
```

### Painel Administrativo

```md
![Admin](docs/admin.png)
```

---

## 🔄 Fluxo do Pedido

```text
Cliente realiza o pedido
            ↓
Pedido recebido pela cozinha
            ↓
Status: Pendente
            ↓
Status: Em Preparo
            ↓
Status: Pronto
            ↓
Entregador retira o pedido
            ↓
Status: Em Entrega
            ↓
Cliente informa código de confirmação
            ↓
Status: Entregue
            ↓
Avaliação do pedido
```

---

## 🔐 Perfis de Acesso

| Perfil        | E-mail                                                    |
| ------------- | --------------------------------------------------------- |
| Administrador | [admin@labatuti.com](mailto:admin@labatuti.com)           |
| Cozinha       | [cozinha@labatuti.com](mailto:cozinha@labatuti.com)       |
| Entregador    | [entregador@labatuti.com](mailto:entregador@labatuti.com) |
| Cliente       | Cadastro livre pela plataforma                            |

> As credenciais administrativas são disponibilizadas apenas para demonstração e avaliação do projeto.

---

## 📂 Estrutura do Projeto

```text
labatuti/
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── cadastro/
│   │   ├── cliente/
│   │   ├── cozinha/
│   │   ├── entregador/
│   │   ├── sobre/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── firebase.config.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
└── firebase.json
```

---

## 🗄️ Estrutura do Banco de Dados

| Coleção      | Descrição                      |
| ------------ | ------------------------------ |
| usuarios     | Dados dos usuários cadastrados |
| pratos       | Cardápio do restaurante        |
| pedidos      | Pedidos realizados             |
| cupons       | Cupons de desconto             |
| avaliacoes   | Avaliações dos pedidos         |
| estoque      | Controle de estoque            |
| fornecedores | Cadastro de fornecedores       |

---

## ⚙️ Como Executar Localmente

### Pré-requisitos

* Node.js 18+
* Angular CLI 19+
* Conta Firebase

### 1. Clonar o Repositório

```bash
git clone https://github.com/emillypatriota/Labatuti.git
cd Labatuti
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Firebase

Edite o arquivo:

```text
src/app/firebase.config.ts
```

e insira as credenciais do seu projeto Firebase.

### 4. Executar o Projeto

```bash
ng serve
```

### 5. Acessar no Navegador

```text
http://localhost:4200
```

---

## ☁️ Deploy

Para publicar uma nova versão:

```bash
ng build
firebase deploy
```

---

## 👥 Equipe de Desenvolvimento

| Integrante                     | Responsabilidades                                                 |
| ------------------------------ | ----------------------------------------------------------------- |
| Emilly Vitória Garcia Patriota | Tela Inicial (Home), Cadastro de Usuários e Módulo Cozinha        |
| Lucas                          | Painel Administrativo (Admin), Módulo Cliente e Página Sobre Nós  |
| Enzo                           | Módulo Entregador, Painel Administrativo (Admin) e Módulo Cliente |

---

## 🎓 Curso

Projeto desenvolvido para a disciplina de **Desenvolvimento Web** do curso de **Tecnólogo em Análise e Desenvolvimento de Sistemas (ADS)**.

---

## 📄 Licença

Projeto desenvolvido exclusivamente para fins acadêmicos e educacionais.

---

<p align="center">
  Feito com ❤️ pela equipe Labatuti
</p>
