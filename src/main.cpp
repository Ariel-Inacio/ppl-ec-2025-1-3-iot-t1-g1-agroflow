#include <Arduino.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "main.h"

// Definindo os Sensores
#define DHT_PIN 5 // Pino do sensor DHT11
#define DHT_TYPE DHT11 // Tipo do sensor DHT
#define UMIDADE_SOLO 33 // Pino do sensor de umidade do solo
#define LUMINOSIDADE 32 // Pino do sensor de luminosidade (LDR)

// Definindo as Saídas.
#define LED_LUMINOSIDADE 22 // LED para indicar baixa luminosidade
#define VENTOINHA 23 // Pino da ventoinha
#define LED_UMIDADE 21 // LED para indicar baixa umidade
#define LED_SOLO 3 // LED para indicar baixa umidade do solo

// Definições para MQTT
#define TOPICO_LUZ "sensor/luminosidade"
#define TOPICO_TEMPERATURA "sensor/temperatura"
#define TOPICO_UMIDADE_AR "sensor/umidade/ar"
#define TOPICO_UMIDADE_SOLO "sensor/umidade/solo"

#define ID_MQTT "Agroflow" // ID MQTT para identificação de sessão

const char *BROKER_MQTT = "mqtt.verticordia.com";
int BROKER_PORT = 1883;

// Configuração do WiFi
const char *SSID = "";
const char *PASSWORD = "";
// const char* SSID = "WIFI CASA19 5G";
// const char* PASSWORD = "brancaleone";

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
	String msg;

	for (int i = 0; i < length; i++) {
		msg += (char)payload[i];
	}

	Serial.print("Comando MQTT recebido: ");
	Serial.println(msg);

	/* if (strcmp(topic, TOPICO_LUZ) == 0) {
		if (msg.equals("0")) {
			digitalWrite(LED_LUMINOSIDADE, LOW);
			Serial.println("LED(Luminosidade) apagado via MQTT");
		} else {
			digitalWrite(LED_LUMINOSIDADE, 255);
			Serial.println("LED(Luminosidade) aceso via MQTT");
		}
	} else if (strcmp(topic, TOPICO_TEMPERATURA) == 0) {
		if (msg.equals("0")) {
			digitalWrite(VENTOINHA, LOW);
			Serial.println("Ventiladores desligados via MQTT");
		} else {
			digitalWrite(VENTOINHA, 255);
			Serial.println("Ventiladores ligados via MQTT");
		}
	} else if (strcmp(topic, TOPICO_UMIDADE_AR) == 0) {
		if (msg.equals("0")) {
			digitalWrite(LED_UMIDADE, LOW);
			Serial.println("LED(Umidade) apagado via MQTT");
		} else {
			digitalWrite(LED_UMIDADE, 255);
			Serial.println("LED(Umidade) aceso via MQTT");
		}
	} else if (strcmp(topic, TOPICO_UMIDADE_SOLO) == 0) {
		if (msg.equals("0")) {
			digitalWrite(LED_SOLO, LOW);
			Serial.println("LED(Bomba) apagado via MQTT");
		} else {
			digitalWrite(LED_SOLO, 255);
			Serial.println("LED(Bomba) aceso via MQTT");
		}
	} */
}

// Reconectar ao MQTT
void reconnectMQTT(void)
{
	while (!MQTT.connected()) {
		Serial.println("Conectando ao Broker MQTT...");
		if (MQTT.connect(ID_MQTT)) {
			Serial.println("Conectado!");
			// MQTT.subscribe(TOPICO_UMIDADE_AR);
			// MQTT.subscribe(TOPICO_LUZ);
			// MQTT.subscribe(TOPICO_TEMPERATURA);
			// MQTT.subscribe(TOPICO_UMIDADE_SOLO);
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
	float temperatura = dht.readTemperature();
	float umidadeAr = dht.readHumidity();
	umidadeAr = 542;
	temperatura = 24;
	int umidadeSolo = analogRead(UMIDADE_SOLO);
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
	pinMode(LED_LUMINOSIDADE, OUTPUT);
	pinMode(LED_UMIDADE, OUTPUT);
	pinMode(VENTOINHA, OUTPUT);
	pinMode(LUMINOSIDADE, INPUT);
	pinMode(UMIDADE_SOLO, INPUT);

	Serial.println("Apagando LEDs");
	Serial.flush();
	digitalWrite(LED_LUMINOSIDADE, LOW);
	digitalWrite(LED_UMIDADE, LOW);
	digitalWrite(VENTOINHA, LOW);

	Serial.println("Inicializando sensor DHT11");
	dht.begin(); // Inicializa o sensor DHT11

	Serial.println("Inicializando WiFi");
	initWiFi();
	initMQTT();
}

void loop()
{
	VerificaConexoesWiFIEMQTT();
	lerSensores();
	MQTT.loop();
	delay(2000);
}
