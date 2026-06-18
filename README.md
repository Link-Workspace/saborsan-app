# Saborsan Catálogo App

App mobile demonstrativo feito em **Vite + React**, usando a paleta, fonte e identidade visual do site da Saborsan.

## O que foi implementado

- Entrada direta no app, sem tela de login inicial.
- Catálogo com busca, filtros e cards de produtos.
- Tela de detalhes do produto com imagem, descrição e informações comerciais.
- Botão **Fazer pedido**.
- Ao pedir sem conta, abre um cadastro central com:
  - e-mail;
  - senha;
  - número de WhatsApp;
  - opção de Empresa / Pessoa Jurídica;
  - campo CNPJ quando empresa estiver selecionado.
- Após criar conta, aparece confirmação de sucesso e o pedido continua automaticamente.
- Aba **Conta** com histórico de compras, solicitações e status de entrega.
- Aba **Novidades** com alimentos que estarão chegando em breve.
- Todas as lógicas são hardcoded/localStorage para demonstração.

## Como rodar no VS Code

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado no terminal, normalmente:

```bash
http://localhost:5173
```

## Como gerar build web

```bash
npm run build
npm run preview
```

## Como transformar em app Android para teste

O projeto já inclui configuração do Capacitor. Depois de instalar as dependências:

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

No Android Studio, você consegue gerar o APK/AAB para teste interno na Play Console.

> Este projeto é demonstrativo. Não possui backend real, login real, banco de dados real ou integração real com pedidos.
