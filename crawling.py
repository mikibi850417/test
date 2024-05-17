import pandas as pd
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from io import StringIO
import re

# Define your hotel data DataFrame here
hotels_df = pd.read_csv("hotels_data.csv")

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

# Subclasses for different hotel sites
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

class BookingHotelCrawler(HotelCrawler):
    def fetch_html(self):
        with webdriver.Chrome(options=self.options) as driver:
            driver.get(self.url)
            time.sleep(3)  # Adjust sleep time as necessary
            return driver.page_source

    def extract_hotel_name(self, soup):
        return soup.find("h2", {"class": "pp-header__title"}).text
    
    def extract_one_night_rate(self, price_str):
        try:
            price = price_str.replace('₩', '').replace(',', '')
            return int(price)
        except Exception as e:
            print(f"Error extracting price from '{price_str}': {e}")
            return None

    def extract_price(self, price_str):
        try:
            if "현재 요금" in price_str:
                price_part = price_str.split("현재 요금 ")[1]
            else:
                price_part = price_str.split()[0]
            return self.extract_one_night_rate(price_part.split()[0])
        except IndexError as e:
            print(f"Error extracting room prices: {e}")
            return None

    def extract_hotel_data(self, soup):
        df_rooms_table = pd.read_html(str(soup))[-2]
        self.df_rooms_table = df_rooms_table
        df = pd.DataFrame(columns=["room_price", "room_name"])
        df["room_name"] = [desc[:desc.find("룸") + 1] for desc in df_rooms_table["객실 유형"]]
        df["room_price"] = [self.extract_price(price) for price in df_rooms_table["오늘 판매가"]]
        return df

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
        match = re.search(r'(\d{1,3}(?:,\d{3})+원)', text)
        price = match.group(1)
        return price

    def extract_hotel_data(self, soup):
        room_grids = soup.find("div", {"class":"css-1z06rwl"})
        df = pd.DataFrame(columns=["room_price", "room_name"])
        for grid in room_grids.find_all("div", {"class":"css-1nnj57j"}):
            room_name = grid.find('h3').text
            pre_room_price = self.pre_extract_one_night_rate(grid.find_all("div", {"class":"rate-plan-container"})[0].text)
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
            room_name = room.find("div", {"class": "css-rs79op"}).text
            room_price = self.extract_one_night_rate(room.find("div", {"class": "css-149gbl6"}).text)
            df.loc[len(df)] = [room_price, room_name]
        return df

# Unified manager class
class HotelCrawlerManager:
    def __init__(self, hotel_name, check_in, check_out, adults=2, children=0, rooms=1):
        self.hotel_name = hotel_name
        self.check_in = check_in
        self.check_out = check_out
        self.adults = adults
        self.children = children
        self.rooms = rooms
        self.hotel_id = hotels_df[hotels_df["Hotel Name"] == hotel_name]

    def get_crawler(self, site):
        url = self.generate_url(site)
        self.url = url
        if site == "agoda":
            return AgodaHotelCrawler(url)
        elif site == "booking":
            return BookingHotelCrawler(url)
        elif site == "expedia":
            return ExpediaHotelCrawler(url)
        elif site == "trip":
            return TripHotelCrawler(url)
        elif site == "yanolja":
            return YanoljaHotelCrawler(url)
        elif site == "yeogi":
            return YeogiHotelCrawler(url)
        else:
            raise ValueError("Unsupported site")

    def generate_url(self, site):
        if site == "agoda":
            agoda_id = self.hotel_id["Agoda ID"].values[0]
            return f"https://www.agoda.com/ko-kr/{agoda_id}/hotel/seoul-kr.html?checkIn={self.check_in}&los=1"
        elif site == "booking":
            booking_id = self.hotel_id["Booking.com ID"].values[0]
            return f"https://www.booking.com/hotel/kr/{booking_id}.ko.html?checkin={self.check_in}&checkout={self.check_out}&group_adults={self.adults}&group_children={self.children}&no_rooms={self.rooms}"
        elif site == "expedia":
            expedia_id = self.hotel_id["Expedia ID"].values[0]
            return f"https://www.expedia.co.kr/{expedia_id}.Hotel-Information?chkin={self.check_in}&chkout={self.check_out}"
        elif site == "trip":
            trip_id = self.hotel_id["Trip.com ID"].values[0]
            return f"https://kr.trip.com/hotels/detail/?hotelId={trip_id}&checkIn={self.check_in}&checkOut={self.check_out}&adult={self.adults}&children={self.children}"
        elif site == "yanolja":
            yanolja_id = self.hotel_id["Yanolja ID"].values[0]
            return f"https://place-site.yanolja.com/places/{yanolja_id}"
        elif site == "yeogi":
            yeogi_id = self.hotel_id["Yeogi ID"].values[0]
            return f"https://www.yeogi.com/domestic-accommodations/{yeogi_id}?checkIn={self.check_in}&checkOut={self.check_out}&personal={self.adults}"
        else:
            raise ValueError("Unsupported site")

    def crawl(self, site):
        crawler = self.get_crawler(site)
        hotel_name, hotel_data = crawler.crawl()
        return hotel_name, hotel_data