uniform sampler2D u_texture;
uniform bool u_renderpass;
uniform vec2 u_resolution;
uniform float u_frame;
uniform vec2 u_mouse_position;
uniform bool u_click;
varying vec2 vUv;

void main() {
  vec2 uv_pixel_step = 1. / u_resolution.xy;
  int neighbours = 0;
  vec4 originalColor = texture(u_texture, vUv);

  if (u_renderpass) {
    // Finding Neighbours
    for (int i = -1; i < 2; i++) {
      for (int j = -1; j < 2; j++) {
        if (i != 0 || j != 0) {
          float neighAlive = texture(u_texture, vUv + (uv_pixel_step * vec2(i, j))).x;

          // Check if pixel is white
          if (neighAlive > 0.5) { 
            neighbours += 1; 
          } 
        }
      }
    }

    // Getting Colors
    float alive = originalColor.x;
    bool stayedAlive = false;

    gl_FragColor = vec4(0., 0., 0., 0.);

    if (alive >= 0.5) {
      // Become Dead (red)
      if (neighbours <= 1 || neighbours >= 4) {
        gl_FragColor.x = 0.;

      // Stay Alive (white)
      } else {
        gl_FragColor.x = 1.;
        stayedAlive = true;
      }
    } else {
      // Become Alive (green)
      if (neighbours == 3) {
        gl_FragColor.x = 1.;
      
      // Stay Dead (black)
      } else {
        gl_FragColor.x = 0.;
      }
    }

    // Overrwrite computation and make alive if near mouse pointer
    float radius = u_click ? 50. : 5.;
    if (length(gl_FragCoord.xy - u_mouse_position) < radius) {
      gl_FragColor.x = 1.;
    }

    // We store post processing effects inside the g/y value of the fragColor
    // x is where the live or dead state is
    if(u_frame > 2.) {
      // Create blur if pixel has changed in this frame (maybe died)
      gl_FragColor.y = originalColor.y * .988 + gl_FragColor.x; // this introduces a motion fade

      // the threshold of when to slow down fading the blur
      if(gl_FragColor.y < .2) {
        // Fade away the blur even slower
        // This fails and creates an unintended grey background due to convert from float [0, 1] to 0-255 and back etc
        gl_FragColor.y  *= .99; 
      }
    }

    // Age factor
    gl_FragColor.w = originalColor.w;
    if (stayedAlive) {
      gl_FragColor.w *= 0.99;
    } else {
      gl_FragColor.w = 1.;
    }

    // Centre circle fade factor
    vec2 centre = u_resolution / 2.;
    float centreFactor =  (1. / ((centre.y * centre.y))) *
      (
        ((gl_FragCoord.x - centre.x - 0.5) * (gl_FragCoord.x - centre.x - 0.5)) +
        ((gl_FragCoord.y - centre.y - 0.5) * (gl_FragCoord.y - centre.y - 0.5)) -
        ((u_resolution.y / 4.) * (u_resolution.y / 4.))
      );

    centreFactor = min(centreFactor, 1.); // Can't be bigger than 1
    centreFactor = max(centreFactor, 0.); // Can't be smaller than 0

    gl_FragColor.z = centreFactor;
  } else {
    gl_FragColor = vec4(originalColor.y * originalColor.z * originalColor.w);
  }
}
