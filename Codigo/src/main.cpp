#include "esp32-hal-gpio.h"
#include "soc/soc_caps.h"
#include <Arduino.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <cstdlib>

#include "main.h"

// Definindo os Sensores
constexpr unsigned char DHT_TYPE = DHT11; // Tipo do sensor DHT
constexpr unsigned char DHT_PIN = 5; // Pino do sensor DHT11
constexpr unsigned char LUMINOSIDADE =
	32; // Pino do sensor de luminosidade (LDR)
constexpr unsigned char UMIDADE_SOLO = 33; // Pino do sensor de umidade do solo

// Definindo os Atuadores.
constexpr unsigned char PINO_BOMBA = 21; // Pino do relé da bomba
constexpr unsigned char PINO_LAMPADA = 22; // Lâmpada
constexpr unsigned char PINO_VENTOINHAS = 23; // Pino do relé da ventoinha

// Definições para MQTT
const char TOPICO_LUZ[] = "sensor/luminosidade";
const char TOPICO_TEMPERATURA[] = "sensor/temperatura";
const char TOPICO_UMIDADE_AR[] = "sensor/umidade/ar";
const char TOPICO_UMIDADE_SOLO[] = "sensor/umidade/solo";

const char TOPICO_LAMPADA[] = "atuador/lampada";
const char TOPICO_BOMBA[] = "atuador/bomba";
const char TOPICO_VENTOINHAS[] = "atuador/ventoinhas";

#define ID_MQTT "Agroflow" // ID MQTT para identificação de sessão

const char *BROKER_MQTT = "mqtt.verticordia.com";
int BROKER_PORT = 1883;

// Configuração do WiFi
const char *SSID = "";
const char *PASSWORD = "";

// Objetos globais
WiFiClient espClient;
PubSubClient MQTT(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// Inicializa o WiFi
void initWiFi(void)
{
	Serial.println("Conectando ao WiFi...");
	reconnectWiFi();
}

// Inicializa o MQTT
void initMQTT(void)
{
	MQTT.setServer(BROKER_MQTT, BROKER_PORT);
	MQTT.setCallback(mqtt_callback);
}

// Função de callback para MQTT
void mqtt_callback(char *topic, byte *payload, unsigned int length)
{
	char msg[128];

	for (int i = 0; i < length; ++i)
		msg[i] = (char)payload[i];
	msg[length] = '\0';

	Serial.print("Comando MQTT recebido: ");
	Serial.println(msg);

	int op = atoi(msg);
	Serial.print("Traduzido: ");
	Serial.println(op);
	Serial.println(topic);
	Serial.println();

	if (!strcmp(topic, TOPICO_VENTOINHAS)) {
		Serial.println(&"Ventoinha:"[op]);
		digitalWrite(PINO_VENTOINHAS, op ? HIGH : LOW);
	} else if (!strcmp(topic, TOPICO_LAMPADA)) {
		Serial.println(&"Ventoinha:"[op]);
		digitalWrite(PINO_LAMPADA, op ? HIGH : LOW);
	} else if (!strcmp(topic, TOPICO_BOMBA)) {
		Serial.println(&"Ventoinha:"[op]);
		if (op) {
			digitalWrite(PINO_BOMBA, LOW);
			delay(5000);
			digitalWrite(PINO_BOMBA, HIGH);
		}
	}
}

// Reconectar ao MQTT
void reconnectMQTT(void)
{
	while (!MQTT.connected()) {
		Serial.println("Conectando ao Broker MQTT...");
		if (MQTT.connect(ID_MQTT)) {
			Serial.println("Conectado!");
			MQTT.subscribe(TOPICO_LAMPADA);
			MQTT.subscribe(TOPICO_VENTOINHAS);
			MQTT.subscribe(TOPICO_BOMBA);
		} else {
			Serial.println(
				"Falha na conexão. Tentando novamente em 2 segundos.");
			delay(2000);
		}
	}
}

// Verifica conexões WiFi e MQTT
void VerificaConexoesWiFIEMQTT(void)
{
	if (!MQTT.connected())
		reconnectMQTT();
	reconnectWiFi();
}

// Reconectar ao WiFi
void reconnectWiFi(void)
{
	if (WiFi.status() == WL_CONNECTED)
		return;

	WiFi.begin(SSID, PASSWORD);
	while (WiFi.status() != WL_CONNECTED) {
		delay(100);
		Serial.print(".");
	}

	Serial.println("\nWiFi conectado com sucesso!");
}

// Leitura dos sensores
void lerSensores(void)
{
	delay(50);
	float temperatura = dht.readTemperature();
	delay(50);
	float umidadeAr = dht.readHumidity();
	int umidadeSolo = 4095 - analogRead(UMIDADE_SOLO);
	int luminosidade = analogRead(LUMINOSIDADE);

	Serial.print("Temperatura: ");
	Serial.print(temperatura);
	Serial.println(" °C");

	Serial.print("Umidade do Ar: ");
	Serial.print(umidadeAr);
	Serial.println("%");

	Serial.print("Umidade do Solo: ");
	Serial.print(umidadeSolo);
	Serial.println("%");

	Serial.print("Luminosidade: ");
	Serial.print(luminosidade);
	Serial.println("%");
	Serial.print("----------------------------------\n\n");

	char buf[32];
	dtostrf(temperatura, 12, 6, buf);
	MQTT.publish(TOPICO_TEMPERATURA, buf);
	dtostrf(luminosidade, 12, 6, buf);
	MQTT.publish(TOPICO_LUZ, buf);
	itoa(umidadeAr, buf, 10);
	MQTT.publish(TOPICO_UMIDADE_AR, buf);
	itoa(umidadeSolo, buf, 10);
	MQTT.publish(TOPICO_UMIDADE_SOLO, buf);
}

void setup()
{
	Serial.begin(9600);
	delay(1000);
	Serial.println("Setup");
	delay(1000);
	Serial.println("\nIniciando ESP32 com sensores...");

	// Configuração dos pinos
	Serial.println("Configurando pinos");
	pinMode(PINO_LAMPADA, OUTPUT);
	pinMode(PINO_BOMBA, OUTPUT);
	pinMode(PINO_VENTOINHAS, OUTPUT);
	pinMode(LUMINOSIDADE, INPUT);
	pinMode(UMIDADE_SOLO, INPUT);

	Serial.println("Apagando LEDs");
	Serial.flush();
	digitalWrite(PINO_LAMPADA, LOW);
	digitalWrite(PINO_BOMBA, HIGH);
	digitalWrite(PINO_VENTOINHAS, LOW);

	Serial.println("Inicializando sensor DHT11");
	dht.begin();

	Serial.println("Inicializando WiFi");
	initWiFi();
	initMQTT();
}

void loop()
{
	VerificaConexoesWiFIEMQTT();
	lerSensores();
	MQTT.loop();
	delay(100);
}
