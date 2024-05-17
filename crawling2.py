from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import pandas as pd
import re
import json

class HotelCrawler:
    def __init__(self, url):
        self.url = url
        self.options = Options()
        self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36')

    def fetch_html(self):
        with webdriver.Chrome(options=self.options) as driver:
            driver.get(self.url)
            time.sleep(3)  # Adjust sleep time as necessary
            return driver.page_source

    def parse_html(self, html):
        return BeautifulSoup(html, "html.parser")

    def extract_hotel_name(self, soup):
        raise NotImplementedError("This method should be overridden by subclasses")

    def extract_hotel_data(self, soup):
        raise NotImplementedError("This method should be overridden by subclasses")
        
    def extract_one_night_rate(self, price):
        price = re.sub(r'[^\d.]', '', price)
        return int(price)

    def crawl(self):
        html = self.fetch_html()
        soup = self.parse_html(html)
        hotel_name = self.extract_hotel_name(soup)
        hotel_data = self.extract_hotel_data(soup)
        return hotel_name, hotel_data

# subclass for Agoda
# This Python class `AgodaHotelCrawler` extends `HotelCrawler` and contains methods to extract hotel
# name, one night rate, and hotel data from a given soup object.
class AgodaHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("p", {"class": "HeaderCerebrum__Name"}).text

    def extract_one_night_rate(self, text):
        matches = re.findall(r'₩\s*(\d+(?:,\d+)*)\s*1박당\s*요금', text)
        return str(matches[0].replace(',', '')) if matches else None

    def extract_hotel_data(self, soup):
        room_table = soup.find_all("div", {"class": "MasterRoom"})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for room in room_table:
            room_name = room.find(class_="MasterRoom__HotelName").text
            room_price = room.find(class_="ChildRoom__PriceContainer").text
            room_price = self.extract_one_night_rate(room_price)
            df.loc[len(df)] = [room_price, room_name]
        return df

# subclass for Booking
#수정해야함 
class BookingHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("h2", {"class": "pp-header__title"}).text

    def extract_hotel_data(self, soup):
        # rooms_rooms_table = soup.find("div", {"id": "rooms_table"})
        # rooms_table = rooms_rooms_table.find("table")
        df_rooms_table = pd.read_html(str(soup))[0]
        df = pd.DataFrame(columns=["room_price", "room_name"])
        time.sleep(3)
        df["room_name"] = [desc[:desc.find("룸") + 1] for desc in df_rooms_table["객실 유형"]]
        df["room_price"] = [self.extract_one_night_rate(price.split("현재 요금 ")[1].split()[0]) for price in df_rooms_table["오늘 판매가"]]    
        return df

# expedia 접속시 캡챠 우회 해야함 
class ExpediaHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("h1").text
    
    def extract_hotel_data(self, soup):
        time.sleep(2)
        room_grid = soup.find("div", {"id": "Offers"})
        room_table = room_grid.find_all("div", {"data-stid": re.compile("property-offer-.*")})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for room in room_table:
            room_name = room.find_all('h3')[-1].text
            price_summary = room.find("div", {"data-test-id": "price-summary"})
            if price_summary:
                room_price = self.extract_one_night_rate(price_summary.find("span").text)
            else:
                continue
            df.loc[len(df)] = [room_price, room_name]
        return df


class TripHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("h1").text

    def extract_hotel_data(self, soup):
        time.sleep(2)
        room_table = soup.find_all("div", {"class": "commonRoomCard_commonRoomCard___qMtD"})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for room in room_table:
            room_name = room.find("span", {"class": "commonRoomCard_commonRoomCard-title__YgDYt"}).text
            room_options = room.find_all("div", {"class": "saleRoom_saleRoomItemBox__IpWj4"})
            for room_option in room_options:
                room_price = self.extract_one_night_rate(room_option.find("div", {"class": "priceInfo_saleRoomItemBox-priceBox-displayPrice__niIBD"}).text)
                df.loc[len(df)] = [room_price, room_name]
        return df

class YanoljaHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("h1").text
    
    def pre_extract_one_night_rate(self, text):
        # 쉼표로 구분된 숫자와 '원' 문자를 포함하는 패턴으로 가격 추출
        match = re.search(r'(\d{1,3}(?:,\d{3})+원)', text)
        price = match.group(1)
        return price

    def extract_hotel_data(self, soup):
        room_grids = soup.find("div", {"class":"css-1z06rwl"})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for grid in room_grids.find_all("div", {"class":"css-1nnj57j"}):
            room_name = grid.find('h3').text
            pre_room_price = self.pre_extract_one_night_rate(grid.find_all("div", {"class":"rate-plan-container"})[0].text)
            # if gird have class "soldOut" then skip
            if grid.find("div", {"class":"soldOut"}):
                continue
            room_price = self.extract_one_night_rate(pre_room_price)
            df.loc[len(df)] = [room_price, room_name]
        return df
    

class YeogiHotelCrawler(HotelCrawler):
    def extract_hotel_name(self, soup):
        return soup.find("h1").text

    def extract_hotel_data(self, soup):
        room_grids = soup.find("div", {"id": "room"})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for room in room_grids.find_all("div", {"class": "css-gp2jfw"}):
            room_name  = room.find("div", {"class": "css-rs79op"}).text
            room_price = self.extract_one_night_rate(room.find("div", {"class": "css-149gbl6"}).text)
            df.loc[len(df)] = [room_price, room_name]
        return df

