#pragma once

#include <Arduino.h>

// Prototypes
void initWiFi(void);
void initMQTT(void);
void mqtt_callback(char *topic, byte *payload, unsigned int length);
void reconnectMQTT(void);
void reconnectWiFi(void);
void VerificaConexoesWiFIEMQTT(void);
void lerSensores(void);
