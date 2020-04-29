function create_canvas(width, height) {
  var canv = document.createElement('canvas', '');
  canv.setAttribute('width', width);
  canv.setAttribute('height', height);
  if(typeof G_vmlCanvasManager != 'undefined')
   canv = G_vmlCanvasManager.initElement(canv);
  return canv;
}

function clear_canvas(canv) {
  var context = canv.getContext("2d");
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function draw_on_canvas(canv, drawing, line_width, t_lim, to_scale, separate_scaling=false, eps=20) {
  if (to_scale) {
    var canv_width = canv.clientHeight;
    var canv_height = canv.clientWidth;
    if (canv_width == 0 && canv_height == 0) {
      canv_width = canv.width;
      canv_height = canv.height;
    }
    console.log("draw on cavas -- size of canvas: ", canv_width, canv_height)
    drawing = scale_drawing(drawing, canv_width, canv_height, separate_scaling, eps);
  }

  clear_canvas(canv);

  var context = canv.getContext("2d");

  context.strokeStyle = "black";
  context.lineJoin = "round";
  context.lineWidth = line_width;

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      if (drawing[i][j].t > t_lim)
        break;
      context.beginPath();
      if (j > 0)
        context.moveTo(drawing[i][j-1].x, drawing[i][j-1].y);
      else
        context.moveTo(drawing[i][j].x-1, drawing[i][j].y);
      context.lineTo(drawing[i][j].x, drawing[i][j].y);
      context.closePath();
      context.stroke();
    }
  }
}

function get_last_time(drawing) {
  var n = drawing.length;
  var m = drawing[n-1].length;
  return drawing[n-1][m-1].t;
}

function scale_drawing(drawing, width, height, separate_scaling=false, eps=20) {
  var minx = Number.POSITIVE_INFINITY;
  var miny = Number.POSITIVE_INFINITY;

  var maxx = Number.NEGATIVE_INFINITY;
  var maxy = Number.NEGATIVE_INFINITY;

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      minx = Math.min(minx, drawing[i][j].x);
      miny = Math.min(miny, drawing[i][j].y);

      maxx = Math.max(maxx, drawing[i][j].x);
      maxy = Math.max(maxy, drawing[i][j].y);
    }
  }

  var scale_x = 1;
  var scale_y = 1;
  if (separate_scaling) {
    scale_x = (width - 2*eps) / (maxx - minx);
    sacle_y = (height - 2*eps) / (maxy - miny);
  } else {
    var scale = (Math.min(width, height) - 2*eps) / Math.max(maxx - minx, maxy - miny);
    scale_x = scale;
    scale_y = scale;
  }

  if (Math.abs(scale_x - 1) <= 1e-9 && Math.abs(scale_y - 1) <= 1e-9)
    return drawing;
  console.log("window size: ",  width, height)
  console.log("maxx minx ", maxx, minx)
  console.log("maxy miny ", maxy, miny)
  console.log("scale: ", scale_x, scale_x)

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      drawing[i][j].x = Math.round((drawing[i][j].x - minx) * scale_x) + eps;
      drawing[i][j].y = Math.round((drawing[i][j].y - miny) * scale_y) + eps;
    }
    drawing[i] = simplify(drawing[i], 2, true);
  }
  return drawing;
}
