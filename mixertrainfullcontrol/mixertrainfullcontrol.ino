#include <AFMotor.h>
const int MAX_MOTOR_SPEED = 200;
const int MIN_MOTOR_SPEED = 0;




AF_DCMotor motor(1, MOTOR12_64KHZ); // create motor #2, 64KHz pwm
bool forwards; 
int curSpeed;
void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Startup!");
  motor.setSpeed(MIN_MOTOR_SPEED);     // set the speed to 200/255
  curSpeed = MIN_MOTOR_SPEED;
  motor.run(FORWARD);
  forwards = true;
}
 
void loop() {
  if (Serial.available()){
    if (Serial.peek() == 'f') {
      Serial.read();
      if (curSpeed + 10 < MAX_MOTOR_SPEED) {
        curSpeed += 10;
      } else {
        curSpeed = MAX_MOTOR_SPEED;
      }
      motor.setSpeed(curSpeed);
    }
    if (Serial.peek() == 's') {
      Serial.read();
      if (curSpeed - 10 > MIN_MOTOR_SPEED) {
        curSpeed -= 10;
      } else {
        curSpeed = 0;
      }
      motor.setSpeed(curSpeed);
    }
    if (Serial.peek() == 'r') {
      Serial.read();
      forwards = !forwards;
      if (forwards) {
        motor.run(FORWARD);
      } else {
        motor.run(BACKWARD);
      }
    }
  }
}


