import pandas as pd

hotels_data = {
    "Hotel Name": [
        "호텔 스카이파크 명동 3호점",
        "밀리오레 호텔 서울 명동",
        "소테츠 프레사 인 서울 명동",
        "나인트리 호텔 명동",
        "프린스 호텔 명동",
        "스탠포드 호텔 명동"
    ],
    "Agoda ID": [
        "hotel-skypark-myeongdong-iii",
        "loisir-hotel-seoul-myeongdong",
        "sotetsu-fresa-inn-seoul-myeong-dong",
        "nine-tree-hotel-myeong-dong",
        "prince-hotel-myeongdong",
        "stanford-hotel-myeongdong"
    ],
    "Booking.com ID": [
        "skypark-myeongdong-3",
        "loisir-seoul-myeongdong",
        "sotetsu-fresa-inn-seoul-myeong-dong",
        "nine-tree",
        "hotel-prince-seoul",
        "seutaenpodeuhotel-myeongdong-stanford-myeongdong"
    ],
    "Expedia ID": [
        "Seoul-Hotels-HOTEL-SKYPARK-Myeongdong-III.h4465738",
        "Seoul-Hotels-Migliore-Hotel-Seoul-Myeongdong.h9652850",
        "Seoul-Hotels-Sotetsu-Fresa-Inn-Seoul-Myeong-Dong.h37207489",
        "Seoul-Hotels-Nine-Tree-Hotel-Myeongdong.h6084370",
        "Seoul-Hotels-Hotel-Prince-Seoul.h2321943",
        "Seoul-Hotels-Stanford-Hotel-Myeongdong.h74101909"        
    ],
    "Trip.com ID": [
        "988482",
        "1687209",
        "41496077",
        "988649",
        "988630",
        "83924501"
    ],
    "Yanolja ID": [
        "3001826",
        "1000114102",
        "1000108504",
        "3000612",
        "3000619",
        "10042533"
    ],
    "Yeogi ID": [
        "6551",
        "67993",
        "64580",
        "6492",
        "6283",
        "69970"
    ]
}

# 데이터 프레임 생성
hotels_df = pd.DataFrame(hotels_data)

# 데이터 프레임 저장
hotels_df.to_csv("./hotels_data.csv", index=False)