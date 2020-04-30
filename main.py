from flask import Flask, render_template, redirect, url_for, request, jsonify
import numpy as np
from PIL import Image
import base64
import re
import io

import tensorflow as tf
import tensorflow.keras as tfk

app = Flask(__name__)
app.config['SECRET_KEY'] = 'DontTellAnyone'

input_shape = (64, 64)
syllables = ["a", "ba", "da/ra", "e/i", "ga", "ha", "ka", "la", "ma", "na", "nga", "o/u", "pa", "sa", "ta", "wa", "ya"];
syllable_encoding = {}
for i in range(len(syllables)):
    syllable_encoding[syllables[i]] = i

model = None

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/data', methods=['GET', 'POST'])
def data():
    return render_template('data.html')

def preprocess_image(image_source):
    image_b64  = re.sub('^data:image/.+;base64,', '', image_source)
    image_data = base64.b64decode(str(image_b64))
    image_pil  = Image.open(io.BytesIO(image_data))
    image_np   = np.array(image_pil)
    image = image_np[:,:,3] / 255.0
    return image

def decode_label(enc):
    return syllables[enc]

def argmax(probability_logits):
    return np.argmax(probability_logits)

def neural_net_prediction(image):
    return model.predict(np.expand_dims(image, axis=0))

def predict(image):
    return decode_label(argmax(neural_net_prediction(image)))

@app.route('/save', methods=['GET', 'POST'])
def get_image():
    expected_label = request.args.get('expected_label')
    image_source   = request.args.get('image_src')

    print(expected_label, image_source)

    image = preprocess_image(image_source)
    print("image size:", image.shape)

    global model
    if not model:
        model = tfk.models.load_model('static/baybayin_model.h5')
        print("reloaded model")

    predicted_label = predict(image)

    print("predicted_label: ", predicted_label)

    res = (predicted_label == expected_label);
    return jsonify(predicted_label=predicted_label, result=res)

if __name__ == '__main__':
    app.run(debug=True, host= '0.0.0.0')
