#include <AFMotor.h>

const int SET_RATE_LIMIT = 1000;
const int RATE_LIMIT_COOLDOWN = 60;
const int MOVEMENT_RUN_TIME = 2;
const int MOTOR_SPEED = 110;


AF_DCMotor motor(1, MOTOR12_64KHZ); // create motor #2, 64KHz pwm
int timer;
bool mrunning;
bool forwards; 
int runTime;

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Startup!");
  pinMode(2, INPUT);  // Sensor pin, input
  motor.setSpeed(MOTOR_SPEED);     // set the speed to 200/255
  timer = -3;
  mrunning = false;
  forwards = true;
}
 
void loop() {

  int sensorValue = digitalRead(2);       // Read the sensor.
  if (timer < 0)
  {
    timer += 1;
    Serial.print("Cooling Down ");
    Serial.println(-timer);
    delay(1000);

    
  } 
  else if(sensorValue == HIGH) {                //Only, if the sensor detects motion...
    if (timer < MOVEMENT_RUN_TIME)  timer = MOVEMENT_RUN_TIME;
    Serial.print("Movement ");                   // Print the word "Movement" in the Serial Monitor (Tools > Serial Monitor)
    Serial.print(timer);
    Serial.println(" ");                        // Space and a line break in the Serial Monitor.  
    delay(1000);                                    // Delay 1 second (1000 milliseconds)
  }
  else {                                   //If the sensor does not detect movement...
    if (timer > 0) {
      timer -= 1;
      Serial.print("No Movement ");                   // Print the word "Movement" in the Serial Monitor (Tools > Serial Monitor)
      Serial.print(timer);
      Serial.println(" ");   
    }
    
    delay(1000);
  }
  if (Serial.available()){
    timer = Serial.parseInt();
    runTime = -timer;
  }
  if (mrunning)
  { 
    runTime++;
    if (runTime > SET_RATE_LIMIT)
    {
      timer = 0 - RATE_LIMIT_COOLDOWN;
      runTime = 0;
      Serial.println("Rate Limit Reached - Cooling Down");
    }
    else
    {
      Serial.print("Runtime ");
      Serial.println(runTime);
    }
  }
  else
  {
    if (runTime > 0)
    {
      runTime--;
      Serial.print("Cooling ");
      Serial.println(runTime);
    }
  }

  if (timer > 0 && !mrunning) {
    if (forwards) {
      motor.run(FORWARD);
      //forwards = false;
    }
    else
    {
      motor.run(BACKWARD);
      forwards = true;
    }
    mrunning = true;
    //runTime = 0;
  }
  if (timer <= 0 && mrunning) {
    motor.run(RELEASE);
    mrunning = false;
  }
    
}


