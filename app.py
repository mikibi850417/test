import streamlit as st
from price import get_hotel_price, merge_hotel_data 
import pandas as pd
import plotly.graph_objects as go
import datetime


# click on the link to see the code
st.title('Crawling')
st.write('This is a simple example of web scraping using Python and Streamlit')


hotels = pd.read_csv('hotels_data.csv')
hotel_names = hotels["Hotel Name"].to_list()
sites = sites = ["agoda", "booking", "yanolja", "yeogi", "expedia(동작x수정중)", "trip(동작x수정중)"]
# check box for selecting hotels
selected_hotels = st.multiselect('Select hotels', hotel_names)
selected_sites = st.multiselect('Select sites', sites)
selected_start_date = st.date_input('Start date', value=pd.to_datetime(datetime.datetime.now()))
selected_end_date = st.date_input('End date', value=pd.to_datetime(selected_start_date + datetime.timedelta(days=1)))

def show_hotel_prices(selected_hotels, selected_start_date, selected_end_date, selected_sites):
    if st.button('Get the lowest price'):
        # 가격 정보를 불러옵니다.
        price_data = get_hotel_price(selected_hotels, 
                                     str(selected_start_date), 
                                     str(selected_end_date), 
                                     selected_sites)

        price_data = merge_hotel_data(price_data)
        price_data['room_price'] = pd.to_numeric(price_data['room_price'], errors='coerce')

        # Drop rows where room_price is NaN (if necessary)
        # price_data = price_data.dropna(subset=['room_price'])

        # Group by Hotel Name and find the minimum room_price
        hotel_lowest_price = price_data.groupby(['Hotel Name'])['room_price'].min().reset_index()
        st.write(hotel_lowest_price)

        # show bar chart
        hotels = list(hotel_lowest_price['Hotel Name'])
        prices = list(hotel_lowest_price['room_price'])
        # numeric_prices = [int(p) if isinstance(p, float) else None for p in prices]
        
        # 바 차트 생성 another color by site
        fig = go.Figure(data=[go.Bar(
            x=hotels,
            y=prices,
            text=prices,  # 실제 가격을 텍스트로 표시
            textposition='auto',  # 텍스트 위치 자동 조정
        )])
        
        # 그래프 제목과 축 이름 추가
        fig.update_layout(
            title="호텔별 최저가 비교",
            xaxis_title="호텔",
            yaxis_title="가격 (KRW)",
            yaxis=dict(type='linear')  # 선형 스케일 적용
        )
        
        st.plotly_chart(fig)                
        
        st.write(price_data)


show_hotel_prices(selected_hotels, selected_start_date, selected_end_date, selected_sites)


# read xls file
df = pd.read_excel('AOR.xls')
df['Date'] = pd.to_datetime(df['Date'], format='%Y-%m-%d')
#plot the table Date ADR
# ADR(평균 일일 객실 요금)
import plotly.express as px
fig = px.line(df, x='Date', y='ADR', title='Daily Average Daily Rate (ADR) for Hotel', markers=True)
st.plotly_chart(fig)