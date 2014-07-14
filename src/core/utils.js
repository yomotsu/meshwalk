// @author yomotsu
// MIT License

THREEFIELD.normalizeAngle = function ( angleInDeg ) {

  return ( angleInDeg >= 0 ) ? ( angleInDeg % 360 ) : ( angleInDeg  % 360 + 360 );

};


THREEFIELD.howCloseBetweenAngles = function ( angle1, angle2 ) {

  var angle = Math.min(
    THREEFIELD.normalizeAngle( angle1 - angle2 ),
    THREEFIELD.normalizeAngle( angle2 - angle1 )
  );
  
  return angle;

};
