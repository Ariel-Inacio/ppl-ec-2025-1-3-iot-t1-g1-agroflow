# Materiais

Os materiais utilizados no projeto foram:

- Placa ESP32
- Sensor DHT11 (temperatura e umidade do ar)
- Sensor de umidade do solo analógico
- Sensor de luminosidade (LDR)
- Relés para controle de bomba, lâmpada e ventoinhas
- Fonte de alimentação compatível
- Cabos e protoboard para conexões
- Broker MQTT para comunicação remota

# Desenvolvimento

O desenvolvimento do projeto foi dividido em etapas distintas para garantir a integração entre hardware e software, culminando em uma solução funcional e automatizada para a estufa inteligente.

## Desenvolvimento do Aplicativo

### Interface

A interface do aplicativo foi projetada para permitir o monitoramento em tempo real dos sensores e controle remoto dos atuadores da estufa. Telas simples e intuitivas exibem os valores de temperatura, umidade e luminosidade, além de botões para ativar a bomba, lâmpada e ventoinhas.

### Código

O código do aplicativo foi desenvolvido utilizando JavaScript, incorporando a comunicação via protocolo MQTT para receber dados do ESP32 e enviar comandos de controle.

## Desenvolvimento do Hardware

### Montagem

A montagem do hardware consistiu na conexão do ESP32 aos sensores DHT11, umidade do solo e luminosidade, além dos atuadores através de módulos de relé. Todo o circuito foi organizado em protoboard, garantindo fácil acesso para testes e ajustes.

### Desenvolvimento do Código

O código para o ESP32 foi desenvolvido na VS Code, incluindo a leitura dos sensores, publicação dos dados via MQTT e controle dos atuadores baseado em comandos recebidos. Foi implementada uma lógica de reconexão automática para WiFi e broker MQTT para garantir a estabilidade da comunicação.

## Comunicação entre App e Hardware

A comunicação entre o aplicativo e o hardware foi realizada utilizando o protocolo MQTT, que permite uma troca eficiente de mensagens entre o ESP32 e o aplicativo via broker. O ESP32 publica dados dos sensores em tópicos específicos e escuta comandos nos tópicos dos atuadores, garantindo controle remoto em tempo real.
