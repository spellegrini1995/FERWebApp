#!/usr/bin/python3
# -*- coding: utf-8 -*-

### General imports ###
from __future__ import division
import numpy as np
import pandas as pd
import time
import re
import os
from collections import Counter
import altair as alt

### Flask imports
import requests
from flask import Flask, render_template, session, request, redirect, flash, Response

### Video imports ###
from library.video_emotion_recognition import *

# Flask config
app = Flask(__name__)
app.secret_key = b'(\xee\x00\xd4\xce"\xcf\xe8@\r\xde\xfc\xbdJ\x08W'
app.config['UPLOAD_FOLDER'] = '/Upload'
app.config["CACHE_TYPE"] = "null"

################################################################################
################################## INDEX #######################################
################################################################################

# Home page
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

################################################################################
############################### VIDEO INTERVIEW ################################
################################################################################
# Read the overall dataframe before the user starts to add his own data
df = pd.read_csv('static/js/db/histo.txt', sep=",", names=["density"])

# Video interview template
@app.route('/video', methods=['POST'])
def video() :
    # Display a warning message
    flash('You will have 45 seconds to discuss the topic mentioned above. Due to restrictions, we are not able to redirect you once the video is over. Please move your URL to /video_dash instead of /video_1 once over. You will be able to see your results then.')
    return render_template('video.html')

@app.route("/stream", methods=['POST'])
def stream_page():
    return render_template("video_feed.html")
# Display the video flow (face, landmarks, emotion)

@app.route('/video_1')
def video_1() :
    try :
        # Response is used to display a flow of information
        return Response(gen(),mimetype='multipart/x-mixed-replace; boundary=frame')
    #return Response(stream_template('video.html', gen()))
    except :
        return None

# Dashboard
@app.route('/video_dash', methods=("POST", "GET"))
def video_dash():
    # Load personal history
    df_2 = pd.read_csv('static/js/db/histo_perso.txt')

    def emo_prop(df_2) :
        return [round((100*len(df_2[df_2.density==0])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==1])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==2])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==3])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==4])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==5])/len(df_2)),1),
                    round((100*len(df_2[df_2.density==6])/len(df_2)),1)]

    emotions = ["Angry", "Disgust", "Fear",  "Happy", "Sad", "Surprise", "Neutral"]

    df_hist = pd.DataFrame(columns = ['EMOTION', 'You', 'History'])
    for i in range(len(emotions)):
        df_hist.loc[i] = [emotions[i]] + [str(len(df_2[df_2.density==i]))] + [str(len(df[df.density==i]))]

    df_hist.to_csv('static/js/db/hist_vid.txt', sep=",", index=False)

    emotion = df_2.density.mode()[0]
    emotion_other = df.density.mode()[0]

    def emotion_label(emotion) :
        if emotion == 0 :
            return "Angry"
        elif emotion == 1 :
            return "Disgust"
        elif emotion == 2 :
            return "Fear"
        elif emotion == 3 :
            return "Happy"
        elif emotion == 4 :
            return "Sad"
        elif emotion == 5 :
            return "Surprise"
        else :
            return "Neutral"

    ### Altair Plot
    df_altair = pd.read_csv('static/js/db/prob.csv', header=None, index_col=None).reset_index()
    df_altair.columns = ['Time', 'Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

    
    angry = alt.Chart(df_altair).mark_line(color='orange', strokeWidth=4).encode(
       x='Time:Q',
       y='Angry:Q',
       tooltip=["Angry"]
    )

    disgust = alt.Chart(df_altair).mark_line(color='red', strokeWidth=4).encode(
        x='Time:Q',
        y='Disgust:Q',
        tooltip=["Disgust"])


    fear = alt.Chart(df_altair).mark_line(color='green', strokeWidth=4).encode(
        x='Time:Q',
        y='Fear:Q',
        tooltip=["Fear"])


    happy = alt.Chart(df_altair).mark_line(color='blue', strokeWidth=4).encode(
        x='Time:Q',
        y='Happy:Q',
        tooltip=["Happy"])


    sad = alt.Chart(df_altair).mark_line(color='black', strokeWidth=4).encode(
        x='Time:Q',
        y='Sad:Q',
        tooltip=["Sad"])


    surprise = alt.Chart(df_altair).mark_line(color='pink', strokeWidth=4).encode(
        x='Time:Q',
        y='Surprise:Q',
        tooltip=["Surprise"])


    neutral = alt.Chart(df_altair).mark_line(color='brown', strokeWidth=4).encode(
        x='Time:Q',
        y='Neutral:Q',
        tooltip=["Neutral"])


    chart = (angry + disgust + fear + happy + sad + surprise + neutral).properties(
    width=1000, height=400, title='Probability of each emotion over time')

    chart.save('static/css/chart.html')
    
    return render_template('video_dash.html', emo=emotion_label(emotion), emo_other = emotion_label(emotion_other), prob = emo_prop(df_2), prob_other = emo_prop(df))

if __name__ == '__main__':
    app.run(debug=True)
