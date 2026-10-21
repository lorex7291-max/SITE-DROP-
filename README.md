# Utilidades do Lar — Checkout

Checkout responsivo em português (Brasil), com identidade azul, inspirado nos padrões de usabilidade de grandes marketplaces. É uma implementação estática em HTML, CSS e JavaScript, sem dependências de build.

## Executar

Abra \`index.html\` em um navegador moderno. Para testar a busca de CEP, publique via HTTPS ou rode um servidor local:

\`\`\`sh
python3 -m http.server 8080
\`\`\`

Acesse \`http://localhost:8080\`.

## Recursos

- Formulário de contato e endereço com validação no cliente;
- Consulta opcional de CEP pela API pública ViaCEP (apenas o CEP consultado é enviado ao serviço);
- Seleção visual de Pix, cartão ou boleto (nenhuma cobrança real);
- Controle de quantidade de 1 a 99 com atualização do valor;
- Prévia do pedido em janela de revisão, opção de copiar o resumo e impressão;
- Responsividade para desktop, tablet e celular, com botão fixo no celular;
- Campos com foco visível, rótulos e mensagens de validação acessíveis.

## Configurar antes de publicar como loja real

**IMPORTANTE: é uma demonstração.** O item “Kit Organizador Multiuso”, preço de R$ 49,90 e frete grátis são exemplos. Nenhum pedido é enviado ou armazenado; nenhum pagamento é autorizado, recebido ou confirmado. A escolha de Pix, cartão ou boleto não abre um gateway.

1. Ajuste produto e valor em \`app.js\` (constante \`SAMPLE_PRODUCT\`) e também o texto/imagem/valor inicial em \`index.html\`.
2. Conecte um catálogo e um backend para criação de pedidos com IDs reais. Calcule o total e frete **no servidor**, nunca confie no valor recebido do navegador.
3. Integre um provedor de pagamento. Credenciais secretas, webhooks, valores finais e validação de estoque devem ficar exclusivamente no servidor.
4. Substitua o botão de revisão por um fluxo real de confirmação do pedido e pagamento **somente após** backend, gateway, políticas, informações da empresa e frete estarem configurados.
5. Revise LGPD/privacidade, regras de entrega e políticas comerciais antes de coletar dados de clientes.

O formulário não salva dados pessoais em armazenamento local e a prévia não transmite informações para a loja. A busca de CEP envia o CEP informado ao ViaCEP apenas quando o usuário clica em **Buscar**.

## Estrutura

- \`index.html\`: estrutura semântica, formulário, resumo e janela de revisão.
- \`styles.css\`: identidade visual, estados e layouts adaptativos.
- \`app.js\`: máscara de campos, validação, consulta de CEP, quantidade e prévia.

Não há Supabase configurado ou necessário para esta etapa visual.