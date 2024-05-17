import pandas as pd
hotels_df = pd.read_csv("hotels_data.csv")


class HotelURLManager:
    def __init__(self, hotel_name, check_in, check_out, adults=2, children=0, rooms=1):
        self.hotel_name = hotel_name
        self.check_in = check_in
        self.check_out = check_out
        self.adults = adults
        self.children = children
        self.rooms = rooms
        # find the hotel IDs from the dataframe
        self.hotel_id = hotels_df[hotels_df["Hotel Name"] == hotel_name]

    def agoda_url(self):
        self.agoda_id = self.hotel_id["Agoda ID"].values[0]
        return f"https://www.agoda.com/ko-kr/{self.agoda_id}/hotel/seoul-kr.html?checkIn={self.check_in}&los=2"
    
    def booking_url(self):
        self.booking_id = self.hotel_id["Booking.com ID"].values[0]
        return f"https://www.booking.com/hotel/kr/{self.booking_id}.ko.html?checkin={self.check_in}&checkout={self.check_out}&group_adults={self.adults}&group_children={self.children}&no_rooms={self.rooms}"
    
    def expedia_url(self):
        self.expedia_id = self.hotel_id["Expedia ID"].values[0]
        return f"https://www.expedia.co.kr/{self.expedia_id}.Hotel-Information?chkin={self.check_in}&chkout={self.check_out}"
    
    def trip_url(self):
        self.trip_id = self.hotel_id["Trip.com ID"].values[0]
        return f"https://kr.trip.com/hotels/detail/?hotelId={self.trip_id}&checkIn={self.check_in}&checkOut={self.check_out}&adult={self.adults}&children={self.children}"
    
    def yanolja_url(self):
        self.yanolja_id = self.hotel_id["Yanolja ID"].values[0]
        # Yanolja does not seem to use the same kind of URL scheme, so this is just a placeholder
        return f"https://place-site.yanolja.com/places/{self.yanolja_id}"
    
    def yeogi_url(self):
        self.yeogi_id = self.hotel_id["Yeogi ID"].values[0]
        return f"https://www.yeogi.com/domestic-accommodations/{self.yeogi_id}?checkIn={self.check_in}&checkOut={self.check_out}&personal={self.adults}"
