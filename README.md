# AGROFLOW

`PUC Minas — Lourdes`

`Engenharia de Computação`

`3° semestre`

`Internet das Coisas (IoT)`


## Integrantes

- Amanda Canizela Guimarães
- Ariel Inácio Jordão Coelho
- Bruna de Paula Anselmi
- João Pedro Neffa de Sousa Oliveira
- Lucca Mendes Alves Pellegrini
- Pedro Vitor Martins Caiafa Andrade

## Orientador

Julio Cesar Dillinger Conway

## Resumo do Projeto AgroFlow — Estufa Inteligente

O AgroFlow é uma estufa inteligente que monitora e controla automaticamente o
ambiente para otimizar o cultivo. Ela utiliza os seguintes sensores: DHT11 para
medir temperatura e umidade do ar, sensor de umidade do solo e sensor de
luminosidade.

Para atuar no ambiente, conta com dois ventiladores (um para entrada e outro
para saída de ar), uma lâmpada simulada por um LED e uma bomba de água para
irrigação.

O sistema utiliza o protocolo MQTT como broker para comunicação entre sensores,
atuadores e a plataforma. Os dados coletados são armazenados em um banco de
dados e podem ser monitorados por meio de um site. Nesse site, o usuário define
metas para cada parâmetro; quando um valor está fora da meta, os atuadores
correspondentes são acionados automaticamente para corrigir as condições da
estufa.

# Código

- [Código do ESP32](Codigo/src/main.cpp)
- [Código do painel de controle (front end)](App/client/)
- [Código do painel de controle (back end)](App/src/index.js)

# Apresentação

<ol>
<li><a href="Apresentacao/README.md"> Vídeo do Funcionamento</a></li>
<li><a href="Apresentacao/README.md"> Fotos do Projeto</a></li>
</ol>

# Documentação

<ol>
<li><a href="Documentacao/01-Introducão.md"> Introdução</a></li>
<li><a href="Documentacao/02-Metodologias Ágeis.md"> Metodologias Ágeis</a></li>
<li><a href="Documentacao/03-Desenvolvimento.md"> Desenvolvimento </a></li>
<li><a href="Documentacao/04-Testes.md"> Testes </a></li>
<li><a href="Documentacao/05-Conclusão.md"> Conclusão </a></li>
<li><a href="Documentacao/06-Referências.md"> Referências </a></li>
</ol>

