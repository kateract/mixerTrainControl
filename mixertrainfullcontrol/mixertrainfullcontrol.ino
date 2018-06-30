#include <AFMotor.h>
const int MAX_MOTOR_SPEED = 250;
const int MIN_MOTOR_SPEED = 50;




AF_DCMotor motor(1, MOTOR12_64KHZ); // create motor #2, 64KHz pwm
bool forwards; 
int curSpeed;
void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Startup!");
  motor.setSpeed(0);     // set the speed to 200/255
  curSpeed = 0;
  motor.run(FORWARD);
  forwards = true;
}
 
void loop() {
  if (Serial.available()){
    if (Serial.peek() == 'f') {
      Serial.read();
      if (curSpeed == 0) {
        curSpeed = MIN_MOTOR_SPEED;
      }
      if (curSpeed + 10 < MAX_MOTOR_SPEED) {
        curSpeed += 10;
      } else {
        curSpeed = MAX_MOTOR_SPEED;
      }
      motor.setSpeed(curSpeed);
      Serial.println(curSpeed);
    }
    else if (Serial.peek() == 's') {
      Serial.read();
      if (curSpeed - 10 > MIN_MOTOR_SPEED) {
        curSpeed -= 10;
      } else {
        curSpeed = 0;
      }
      motor.setSpeed(curSpeed);
      Serial.println(curSpeed);
    }
    else if (Serial.peek() == 'r') {
      Serial.read();
      Serial.println("SLOWING DOWN SO WE CAN GO.... ");
      int turningSpeed = curSpeed;
      while (turningSpeed > MIN_MOTOR_SPEED) {
        turningSpeed -= 10;
        motor.setSpeed(turningSpeed);
        delay(200);
      }
      motor.setSpeed(MIN_MOTOR_SPEED);
      delay(100);
      forwards = !forwards;
      if (forwards) {
        motor.run(FORWARD);
        Serial.println("FORWARDS!");
      } else {
        motor.run(BACKWARD);
        Serial.println("BACKWARDS!");
      }
      while (turningSpeed < curSpeed) {
        turningSpeed += 10; 
        motor.setSpeed(turningSpeed);
        delay(200);
      }
      motor.setSpeed(curSpeed);
      Serial.println("HA!");
    }
    else 
    {
      Serial.read();
      Serial.println("INCORRECT KEY DETECTED! EMERGENCY STOP!");
      while (curSpeed > 0) { 
        curSpeed -= 10;
        if (curSpeed < MIN_MOTOR_SPEED) {
          motor.run(RELEASE);
          curSpeed = 0;
        }
        else {
          motor.setSpeed(curSpeed);
        }
        delay(100);
      }
    }
  }
}



