from crawling import HotelCrawlerManager
import pandas as pd
import datetime

def get_hotel_price(hotel_names:list, start_date, end_date, sites:list):
    results = []
    for hotel_name in hotel_names:
        hotel_manager = HotelCrawlerManager(hotel_name, start_date, end_date)
        try:
            for site in sites:
                _ , hotel_data = hotel_manager.crawl(site)
                results.append((hotel_name, hotel_data, site, hotel_manager.url))
        except Exception as e:
            print(f"Error occurred while processing hotel {hotel_name} on site {site}: {e}")
    return results

def merge_hotel_data(result_list:list):
    df = pd.DataFrame(columns=["Hotel Name", "Site"])
    for hotel_name, hotel_data, site, url in result_list:
        hotel_data["Hotel Name"] = hotel_name
        hotel_data["Site"] = site
        hotel_data["URL"] = url
        df = pd.concat([df, hotel_data], ignore_index=True)
    return df