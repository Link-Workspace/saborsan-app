# Azure SQL - Checklist de Segurança

Configurações a aplicar no recurso `saborsan-db` / servidor `saborsan-sql-server` quando o projeto estiver em produção.

---

## 1. Microsoft Defender para SQL
**Onde:** Portal Azure → saborsan-sql-server → Microsoft Defender for Cloud  
**O que fazer:** Habilitar o plano (custa ~$15 USD/servidor/mês)  
**Por que:** Detecta ataques de injeção SQL, acessos suspeitos e vulnerabilidades automaticamente

---

## 2. Identidade Gerenciada do Servidor
**Onde:** Portal Azure → saborsan-sql-server → Identidade  
**O que fazer:** Ativar "Identidade gerenciada atribuída pelo sistema"  
**Por que:** Permite que o Azure Functions se autentique no banco sem usar senha — elimina credenciais hardcoded

---

## 3. Substituir autenticação SQL por Azure AD
**Onde:** Portal Azure → saborsan-sql-server → Microsoft Entra ID  
**O que fazer:** Definir um administrador do Azure AD e migrar a autenticação para Azure AD Only  
**Por que:** Autenticação SQL (usuário/senha) é menos segura que Azure AD com MFA

---

## 4. Transparent Data Encryption - Chave Gerenciada pelo Cliente (CMK)
**Onde:** Portal Azure → saborsan-db → Transparent Data Encryption  
**O que fazer:** Criar um Azure Key Vault e configurar uma chave gerenciada pelo cliente  
**Por que:** Atualmente usa chave gerenciada pela Microsoft — CMK dá controle total sobre a criptografia em repouso

---

## 5. SQL Razão (Ledger / Auditoria)
**Onde:** Portal Azure → saborsan-db → Auditoria  
**O que fazer:** Habilitar Auditoria → armazenar logs em uma Storage Account ou Log Analytics  
**Por que:** Registra todas as queries e acessos — essencial para rastrear incidentes e atender LGPD

---

## 6. Ponto de Extremidade Privado
**Onde:** Portal Azure → saborsan-sql-server → Rede → Ponto de extremidade privado  
**O que fazer:** Criar uma VNet + Private Endpoint e mudar conectividade de "Público" para "Privado"  
**Por que:** Remove o banco da internet pública — só recursos dentro da VNet conseguem conectar  
**Pré-requisito:** Azure Functions também precisa ser integrado à mesma VNet

---

## 7. Remover IP do cliente do Firewall
**Onde:** Portal Azure → saborsan-sql-server → Rede → Regras de firewall  
**O que fazer:** Remover a regra com o IP pessoal (177.37.81.52) após configurar acesso via ferramenta gerenciada  
**Por que:** IP residencial/comercial pode mudar e manter IPs fixos no firewall é uma superfície de ataque

---

## 8. Always Encrypted para dados sensíveis
**Onde:** Portal Azure → saborsan-db → Always Encrypted  
**O que fazer:** Habilitar para colunas sensíveis (CPF, telefone, dados pessoais de clientes)  
**Por que:** Criptografa colunas específicas — nem o DBA consegue ver os dados em texto claro  
**Pré-requisito:** Requer ajuste no código da aplicação para funcionar

---

## Resumo de prioridades

| Prioridade | Item | Custo estimado |
|---|---|---|
| 🔴 Alta | Ponto de Extremidade Privado | ~$10/mês |
| 🔴 Alta | Identidade Gerenciada + Azure AD | Gratuito |
| 🔴 Alta | Auditoria habilitada | ~$0.10/GB |
| 🟡 Média | Microsoft Defender para SQL | $15/mês |
| 🟡 Média | Chave Gerenciada pelo Cliente (CMK) | ~$5/mês (Key Vault) |
| 🟢 Baixa | Always Encrypted | Gratuito (custo de dev) |
