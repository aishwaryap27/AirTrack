"""
AirTrack — Synthetic Dataset Generator
Generates reproducible aviation datasets:
- 100 Airports
- 50 Airlines
- 20 Aircraft Types
- 50,000 Flight Records
"""

import os
import json
import math
import random
from datetime import datetime, timedelta, timezone

SEED = 42
random.seed(SEED)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. 100 REALISTIC AIRPORTS
# -------------------------------------------------------------
AIRPORTS_RAW = [
    # North America
    ("ATL", "KATL", "Hartsfield-Jackson Atlanta International Airport", "Atlanta", "United States", 33.6407, -84.4277, "America/New_York", 5, 1026),
    ("DFW", "KDFW", "Dallas/Fort Worth International Airport", "Dallas", "United States", 32.8998, -97.0403, "America/Chicago", 7, 607),
    ("DEN", "KDEN", "Denver International Airport", "Denver", "United States", 39.8561, -104.6737, "America/Denver", 6, 5431),
    ("ORD", "KORD", "O'Hare International Airport", "Chicago", "United States", 41.9742, -87.9073, "America/Chicago", 8, 668),
    ("LAX", "KLAX", "Los Angeles International Airport", "Los Angeles", "United States", 33.9416, -118.4085, "America/Los_Angeles", 4, 125),
    ("JFK", "KJFK", "John F. Kennedy International Airport", "New York", "United States", 40.6413, -73.7781, "America/New_York", 4, 13),
    ("SFO", "KSFO", "San Francisco International Airport", "San Francisco", "United States", 37.6213, -122.3790, "America/Los_Angeles", 4, 13),
    ("SEA", "KSEA", "Seattle-Tacoma International Airport", "Seattle", "United States", 47.4502, -122.3088, "America/Los_Angeles", 3, 433),
    ("MIA", "KMIA", "Miami International Airport", "Miami", "United States", 25.7959, -80.2870, "America/New_York", 4, 8),
    ("MCO", "KMCO", "Orlando International Airport", "Orlando", "United States", 28.4312, -81.3081, "America/New_York", 4, 96),
    ("BOS", "KBOS", "Logan International Airport", "Boston", "United States", 42.3656, -71.0096, "America/New_York", 6, 20),
    ("EWR", "KEWR", "Newark Liberty International Airport", "Newark", "United States", 40.6895, -74.1745, "America/New_York", 3, 18),
    ("IAH", "KIAH", "George Bush Intercontinental Airport", "Houston", "United States", 29.9902, -95.3368, "America/Chicago", 5, 97),
    ("LAS", "KLAS", "Harry Reid International Airport", "Las Vegas", "United States", 36.0840, -115.1537, "America/Los_Angeles", 4, 2181),
    ("PHX", "KPHX", "Phoenix Sky Harbor International Airport", "Phoenix", "United States", 33.4342, -112.0080, "America/Phoenix", 3, 1135),
    ("CLT", "KCLT", "Charlotte Douglas International Airport", "Charlotte", "United States", 35.2140, -80.9431, "America/New_York", 4, 748),
    ("MSP", "KMSP", "Minneapolis-Saint Paul International Airport", "Minneapolis", "United States", 44.8848, -93.2223, "America/Chicago", 4, 842),
    ("DTW", "KDTW", "Detroit Metropolitan Airport", "Detroit", "United States", 42.2162, -83.3554, "America/Detroit", 6, 645),
    ("PHL", "KPHL", "Philadelphia International Airport", "Philadelphia", "United States", 39.8729, -75.2437, "America/New_York", 4, 36),
    ("SLC", "KSLC", "Salt Lake City International Airport", "Salt Lake City", "United States", 40.7899, -111.9791, "America/Denver", 4, 4227),
    ("SAN", "KSAN", "San Diego International Airport", "San Diego", "United States", 32.7338, -117.1933, "America/Los_Angeles", 1, 17),
    ("BWI", "KBWI", "Baltimore/Washington International Airport", "Baltimore", "United States", 39.1774, -76.6684, "America/New_York", 3, 146),
    ("TPA", "KTPA", "Tampa International Airport", "Tampa", "United States", 27.9755, -82.5332, "America/New_York", 3, 26),
    ("PDX", "KPDX", "Portland International Airport", "Portland", "United States", 45.5898, -122.5951, "America/Los_Angeles", 3, 31),
    ("IAD", "KIAD", "Washington Dulles International Airport", "Washington D.C.", "United States", 38.9531, -77.4565, "America/New_York", 4, 312),
    ("AUS", "KAUS", "Austin-Bergstrom International Airport", "Austin", "United States", 30.1975, -97.6664, "America/Chicago", 2, 542),
    ("BNA", "KBNA", "Nashville International Airport", "Nashville", "United States", 36.1263, -86.6774, "America/Chicago", 4, 599),
    ("RDU", "KRDU", "Raleigh-Durham International Airport", "Raleigh", "United States", 35.8801, -78.7880, "America/New_York", 3, 435),
    ("HNL", "PHNL", "Daniel K. Inouye International Airport", "Honolulu", "United States", 21.3187, -157.9224, "Pacific/Honolulu", 4, 13),
    ("ANC", "PANC", "Ted Stevens Anchorage International Airport", "Anchorage", "United States", 61.1743, -149.9962, "America/Anchorage", 3, 152),
    ("YYZ", "CYYZ", "Toronto Pearson International Airport", "Toronto", "Canada", 43.6777, -79.6248, "America/Toronto", 5, 569),
    ("YVR", "CYVR", "Vancouver International Airport", "Vancouver", "Canada", 49.1967, -123.1815, "America/Vancouver", 3, 14),
    ("YUL", "CYUL", "Montréal-Trudeau International Airport", "Montreal", "Canada", 45.4657, -73.7455, "America/Toronto", 3, 118),
    ("YYC", "CYYC", "Calgary International Airport", "Calgary", "Canada", 51.1215, -114.0076, "America/Edmonton", 4, 3557),
    ("MEX", "MMMX", "Mexico City International Airport", "Mexico City", "Mexico", 19.4361, -99.0719, "America/Mexico_City", 2, 7316),
    ("CUN", "MMUN", "Cancún International Airport", "Cancun", "Mexico", 21.0365, -86.8771, "America/Cancun", 2, 20),

    # Europe
    ("LHR", "EGLL", "London Heathrow Airport", "London", "United Kingdom", 51.4700, -0.4543, "Europe/London", 2, 83),
    ("LGW", "EGKK", "London Gatwick Airport", "London", "United Kingdom", 51.1537, -0.1821, "Europe/London", 2, 202),
    ("MAN", "EGCC", "Manchester Airport", "Manchester", "United Kingdom", 53.3537, -2.2750, "Europe/London", 2, 257),
    ("EDI", "EGPH", "Edinburgh Airport", "Edinburgh", "United Kingdom", 55.9508, -3.3725, "Europe/London", 1, 136),
    ("CDG", "LFPG", "Paris Charles de Gaulle Airport", "Paris", "France", 49.0097, 2.5479, "Europe/Paris", 4, 392),
    ("ORY", "LFPO", "Paris Orly Airport", "Paris", "France", 48.7262, 2.3652, "Europe/Paris", 3, 291),
    ("AMS", "EHAM", "Amsterdam Airport Schiphol", "Amsterdam", "Netherlands", 52.3105, 4.7683, "Europe/Amsterdam", 6, -11),
    ("FRA", "EDDF", "Frankfurt Airport", "Frankfurt", "Germany", 50.0379, 8.5622, "Europe/Berlin", 4, 364),
    ("MUC", "EDDM", "Munich Airport", "Munich", "Germany", 48.3537, 11.7750, "Europe/Berlin", 2, 1487),
    ("BER", "EDDB", "Berlin Brandenburg Airport", "Berlin", "Germany", 52.3667, 13.5033, "Europe/Berlin", 2, 157),
    ("MAD", "LEMD", "Adolfo Suárez Madrid-Barajas Airport", "Madrid", "Spain", 40.4839, -3.5680, "Europe/Madrid", 4, 1998),
    ("BCN", "LEBL", "Josep Tarradellas Barcelona-El Prat Airport", "Barcelona", "Spain", 41.2974, 2.0833, "Europe/Madrid", 3, 14),
    ("FCO", "LIRF", "Leonardo da Vinci-Fiumicino Airport", "Rome", "Italy", 41.8003, 12.2389, "Europe/Rome", 3, 15),
    ("MXP", "LIMC", "Milan Malpensa Airport", "Milan", "Italy", 45.6301, 8.7255, "Europe/Rome", 2, 768),
    ("ZRH", "LSZH", "Zurich Airport", "Zurich", "Switzerland", 47.4582, 8.5555, "Europe/Zurich", 3, 1416),
    ("GVA", "LSGG", "Geneva Airport", "Geneva", "Switzerland", 46.2370, 6.1089, "Europe/Zurich", 2, 1411),
    ("VIE", "LOWW", "Vienna International Airport", "Vienna", "Austria", 48.1103, 16.5697, "Europe/Vienna", 2, 600),
    ("CPH", "EKCH", "Copenhagen Airport", "Copenhagen", "Denmark", 55.6180, 12.6508, "Europe/Copenhagen", 3, 17),
    ("ARN", "ESSA", "Stockholm Arlanda Airport", "Stockholm", "Sweden", 59.6498, 17.9238, "Europe/Stockholm", 3, 137),
    ("OSL", "ENGM", "Oslo Airport Gardermoen", "Oslo", "Norway", 60.1976, 11.1004, "Europe/Oslo", 2, 681),
    ("HEL", "EFHK", "Helsinki-Vantaa Airport", "Helsinki", "Finland", 60.3172, 24.9633, "Europe/Helsinki", 3, 179),
    ("DUB", "EIDW", "Dublin Airport", "Dublin", "Ireland", 53.4264, -6.2499, "Europe/Dublin", 2, 242),
    ("LIS", "LPPT", "Humberto Delgado Airport", "Lisbon", "Portugal", 38.7756, -9.1354, "Europe/Lisbon", 2, 374),
    ("ATH", "LGAV", "Athens International Airport", "Athens", "Greece", 37.9364, 23.9445, "Europe/Athens", 2, 308),
    ("WAW", "EPWA", "Warsaw Chopin Airport", "Warsaw", "Poland", 52.1672, 20.9679, "Europe/Warsaw", 2, 362),
    ("PRG", "LKPR", "Václav Havel Airport Prague", "Prague", "Czech Republic", 50.1008, 14.2600, "Europe/Prague", 2, 1247),
    ("BUD", "LHBP", "Budapest Ferenc Liszt International Airport", "Budapest", "Hungary", 47.4369, 19.2556, "Europe/Budapest", 2, 495),
    ("IST", "LTFM", "Istanbul Airport", "Istanbul", "Turkey", 41.2753, 28.7519, "Europe/Istanbul", 5, 325),
    ("SAW", "LTFJ", "Sabiha Gökçen International Airport", "Istanbul", "Turkey", 40.8986, 29.3092, "Europe/Istanbul", 2, 312),

    # Asia & Middle East
    ("DXB", "OMDB", "Dubai International Airport", "Dubai", "United Arab Emirates", 25.2532, 55.3657, "Asia/Dubai", 2, 62),
    ("DOH", "OTHH", "Hamad International Airport", "Doha", "Qatar", 25.2731, 51.6081, "Asia/Qatar", 2, 13),
    ("AUH", "OMAA", "Zayed International Airport", "Abu Dhabi", "United Arab Emirates", 24.4330, 54.6511, "Asia/Dubai", 2, 88),
    ("RUH", "OERK", "King Khalid International Airport", "Riyadh", "Saudi Arabia", 24.9576, 46.6988, "Asia/Riyadh", 2, 2049),
    ("JED", "OEJN", "King Abdulaziz International Airport", "Jeddah", "Saudi Arabia", 21.6796, 39.1565, "Asia/Riyadh", 3, 48),
    ("HND", "RJTT", "Tokyo Haneda Airport", "Tokyo", "Japan", 35.5494, 139.7798, "Asia/Tokyo", 4, 35),
    ("NRT", "RJAA", "Narita International Airport", "Tokyo", "Japan", 35.7647, 140.3863, "Asia/Tokyo", 2, 141),
    ("KIX", "RJBB", "Kansai International Airport", "Osaka", "Japan", 34.4320, 135.2304, "Asia/Tokyo", 2, 26),
    ("ICN", "RKSI", "Incheon International Airport", "Seoul", "South Korea", 37.4602, 126.4407, "Asia/Seoul", 4, 23),
    ("SIN", "WSSS", "Singapore Changi Airport", "Singapore", "Singapore", 1.3644, 103.9915, "Asia/Singapore", 3, 22),
    ("HKG", "VHHH", "Hong Kong International Airport", "Hong Kong", "Hong Kong", 22.3080, 113.9185, "Asia/Hong_Kong", 3, 28),
    ("BKK", "VTBS", "Suvarnabhumi Airport", "Bangkok", "Thailand", 13.6900, 100.7501, "Asia/Bangkok", 2, 5),
    ("KUL", "WMKK", "Kuala Lumpur International Airport", "Kuala Lumpur", "Malaysia", 2.7456, 101.7099, "Asia/Kuala_Lumpur", 3, 69),
    ("CGK", "WIII", "Soekarno-Hatta International Airport", "Jakarta", "Indonesia", -6.1256, 106.6559, "Asia/Jakarta", 3, 34),
    ("MNL", "RPLL", "Ninoy Aquino International Airport", "Manila", "Philippines", 14.5086, 121.0194, "Asia/Manila", 2, 75),
    ("TPE", "RCTP", "Taiwan Taoyuan International Airport", "Taipei", "Taiwan", 25.0797, 121.2342, "Asia/Taipei", 2, 106),
    ("PEK", "ZBAA", "Beijing Capital International Airport", "Beijing", "China", 40.0799, 116.6031, "Asia/Shanghai", 3, 116),
    ("PKX", "ZBAD", "Beijing Daxing International Airport", "Beijing", "China", 39.5098, 116.4105, "Asia/Shanghai", 4, 98),
    ("PVG", "ZSPD", "Shanghai Pudong International Airport", "Shanghai", "China", 31.1443, 121.8083, "Asia/Shanghai", 4, 13),
    ("CAN", "ZGGG", "Guangzhou Baiyun International Airport", "Guangzhou", "China", 23.3924, 113.2988, "Asia/Shanghai", 3, 50),
    ("SZX", "ZGSZ", "Shenzhen Bao'an International Airport", "Shenzhen", "China", 22.6393, 113.8107, "Asia/Shanghai", 2, 13),
    ("DEL", "VIDP", "Indira Gandhi International Airport", "New Delhi", "India", 28.5562, 77.1000, "Asia/Kolkata", 4, 777),
    ("BOM", "VABB", "Chhatrapati Shivaji Maharaj International Airport", "Mumbai", "India", 19.0896, 72.8656, "Asia/Kolkata", 2, 39),
    ("BLR", "VOBL", "Kempegowda International Airport", "Bengaluru", "India", 13.1986, 77.7066, "Asia/Kolkata", 2, 3000),
    ("HYD", "VOHS", "Rajiv Gandhi International Airport", "Hyderabad", "India", 17.2403, 78.4294, "Asia/Kolkata", 2, 2024),
    ("MAA", "VOMM", "Chennai International Airport", "Chennai", "India", 12.9941, 80.1709, "Asia/Kolkata", 2, 52),

    # Oceania & Africa & South America
    ("SYD", "YSSY", "Sydney Kingsford Smith Airport", "Sydney", "Australia", -33.9399, 151.1753, "Australia/Sydney", 3, 21),
    ("MEL", "YMML", "Melbourne Airport", "Melbourne", "Australia", -37.6690, 144.8410, "Australia/Melbourne", 2, 434),
    ("BNE", "YBBN", "Brisbane Airport", "Brisbane", "Australia", -27.3842, 153.1175, "Australia/Brisbane", 2, 13),
    ("PER", "YPPH", "Perth Airport", "Perth", "Australia", -31.9403, 115.9669, "Australia/Perth", 2, 67),
    ("AKL", "NZAA", "Auckland Airport", "Auckland", "New Zealand", -37.0082, 174.7850, "Pacific/Auckland", 2, 23),
    ("JNB", "FAOR", "O. R. Tambo International Airport", "Johannesburg", "South Africa", -26.1367, 28.2411, "Africa/Johannesburg", 2, 5558),
    ("CPT", "FACT", "Cape Town International Airport", "Cape Town", "South Africa", -33.9715, 18.6021, "Africa/Johannesburg", 2, 151),
    ("CAI", "HECA", "Cairo International Airport", "Cairo", "Egypt", 30.1219, 31.4056, "Africa/Cairo", 3, 382),
    ("ADD", "HAAB", "Addis Ababa Bole International Airport", "Addis Ababa", "Ethiopia", 8.9779, 38.7993, "Africa/Addis_Ababa", 2, 7625),
    ("NBO", "HKJK", "Jomo Kenyatta International Airport", "Nairobi", "Kenya", -1.3192, 36.9278, "Africa/Nairobi", 2, 5327),
    ("GRU", "SBGR", "São Paulo/Guarulhos International Airport", "São Paulo", "Brazil", -23.4356, -46.4731, "America/Sao_Paulo", 2, 2461),
    ("GIG", "SBGL", "Rio de Janeiro/Galeão International Airport", "Rio de Janeiro", "Brazil", -22.8099, -43.2506, "America/Sao_Paulo", 2, 28),
    ("EZE", "SAEZ", "Ministro Pistarini International Airport", "Buenos Aires", "Argentina", -34.8222, -58.5358, "America/Argentina/Buenos_Aires", 2, 67),
    ("SCL", "SCEL", "Arturo Merino Benítez International Airport", "Santiago", "Chile", -33.3930, -70.7858, "America/Santiago", 2, 1555),
    ("BOG", "SKBO", "El Dorado International Airport", "Bogotá", "Colombia", 4.7016, -74.1469, "America/Bogota", 2, 8361),
    ("LIM", "SPJC", "Jorge Chávez International Airport", "Lima", "Peru", -12.0219, -77.1143, "America/Lima", 2, 113),
]
AIRPORTS_RAW = AIRPORTS_RAW[:100]
assert len(AIRPORTS_RAW) == 100, f"Expected 100 airports, got {len(AIRPORTS_RAW)}"
assert len(set(a[0] for a in AIRPORTS_RAW)) == 100, "Airport IATA codes must be unique"

AIRPORTS = []
for a in AIRPORTS_RAW:
    AIRPORTS.append({
        "iata_code": a[0],
        "icao_code": a[1],
        "name": a[2],
        "city": a[3],
        "country": a[4],
        "coordinates": {"type": "Point", "coordinates": [round(a[6], 4), round(a[5], 4)]}, # [lon, lat] for GeoJSON
        "latitude": round(a[5], 4),
        "longitude": round(a[6], 4),
        "timezone": a[7],
        "runways": a[8],
        "elevation_ft": a[9],
    })

# -------------------------------------------------------------
# 2. 50 REALISTIC AIRLINES
# -------------------------------------------------------------
AIRLINES_RAW = [
    ("AA", "AAL", "American Airlines", "United States", "AMERICAN", 960, "Oneworld", ["DFW", "CLT", "MIA", "ORD"]),
    ("DL", "DAL", "Delta Air Lines", "United States", "DELTA", 980, "SkyTeam", ["ATL", "MSP", "DTW", "SLC"]),
    ("UA", "UAL", "United Airlines", "United States", "UNITED", 940, "Star Alliance", ["ORD", "DEN", "IAH", "SFO", "EWR"]),
    ("WN", "SWA", "Southwest Airlines", "United States", "SOUTHWEST", 815, "None", ["DAL", "MDW", "LAS", "DEN"]),
    ("BA", "BAW", "British Airways", "United Kingdom", "SPEEDBIRD", 280, "Oneworld", ["LHR", "LGW"]),
    ("LH", "DLH", "Lufthansa", "Germany", "LUFTHANSA", 310, "Star Alliance", ["FRA", "MUC"]),
    ("AF", "AFR", "Air France", "France", "AIRFRANS", 220, "SkyTeam", ["CDG", "ORY"]),
    ("KL", "KLM", "KLM Royal Dutch Airlines", "Netherlands", "KLM", 170, "SkyTeam", ["AMS"]),
    ("EK", "UAE", "Emirates", "United Arab Emirates", "EMIRATES", 260, "None", ["DXB"]),
    ("QR", "QTR", "Qatar Airways", "Qatar", "QATARI", 250, "Oneworld", ["DOH"]),
    ("SQ", "SIA", "Singapore Airlines", "Singapore", "SINGAPORE", 155, "Star Alliance", ["SIN"]),
    ("CX", "CPA", "Cathay Pacific", "Hong Kong", "CATHAY", 180, "Oneworld", ["HKG"]),
    ("NH", "ANA", "All Nippon Airways", "Japan", "ALL NIPPON", 240, "Star Alliance", ["HND", "NRT"]),
    ("JL", "JAL", "Japan Airlines", "Japan", "JAPANAIR", 225, "Oneworld", ["HND", "NRT"]),
    ("QF", "QFA", "Qantas Airways", "Australia", "QANTAS", 130, "Oneworld", ["SYD", "MEL", "BNE"]),
    ("TK", "THY", "Turkish Airlines", "Turkey", "TURKISH", 440, "Star Alliance", ["IST", "SAW"]),
    ("IB", "IBE", "Iberia", "Spain", "IBERIA", 140, "Oneworld", ["MAD", "BCN"]),
    ("AZ", "ITY", "ITA Airways", "Italy", "ITARROW", 85, "SkyTeam", ["FCO", "MXP"]),
    ("SK", "SAS", "Scandinavian Airlines", "Sweden", "SCANDINAVIAN", 130, "SkyTeam", ["CPH", "ARN", "OSL"]),
    ("AY", "FIN", "Finnair", "Finland", "FINNAIR", 80, "Oneworld", ["HEL"]),
    ("ET", "ETH", "Ethiopian Airlines", "Ethiopia", "ETHIOPIAN", 145, "Star Alliance", ["ADD"]),
    ("MS", "MSR", "EgyptAir", "Egypt", "EGYPTAIR", 75, "Star Alliance", ["CAI"]),
    ("AI", "AIC", "Air India", "India", "AIRINDIA", 140, "Star Alliance", ["DEL", "BOM"]),
    ("6E", "IGO", "IndiGo", "India", "IFLY", 350, "None", ["DEL", "BOM", "BLR", "HYD"]),
    ("SG", "SEJ", "SpiceJet", "India", "SPICEJET", 55, "None", ["DEL", "BOM"]),
    ("AC", "ACA", "Air Canada", "Canada", "AIR CANADA", 200, "Star Alliance", ["YYZ", "YVR", "YUL"]),
    ("WS", "WJA", "WestJet", "Canada", "WESTJET", 180, "None", ["YYC", "YVR", "YYZ"]),
    ("AM", "AMX", "Aeroméxico", "Mexico", "AEROMEXICO", 150, "SkyTeam", ["MEX", "CUN"]),
    ("LA", "LAN", "LATAM Airlines", "Chile", "LAN CHILE", 330, "None", ["SCL", "GRU", "LIM", "BOG"]),
    ("AR", "ARG", "Aerolíneas Argentinas", "Argentina", "ARGENTINA", 80, "SkyTeam", ["EZE"]),
    ("AV", "AVA", "Avianca", "Colombia", "AVIANCA", 130, "Star Alliance", ["BOG"]),
    ("NZ", "ANZ", "Air New Zealand", "New Zealand", "NEW ZEALAND", 105, "Star Alliance", ["AKL"]),
    ("EY", "ETD", "Etihad Airways", "United Arab Emirates", "ETIHAD", 90, "None", ["AUH"]),
    ("SV", "SVA", "Saudia", "Saudi Arabia", "SAUDIA", 160, "SkyTeam", ["JED", "RUH"]),
    ("TG", "THA", "Thai Airways", "Thailand", "THAI", 70, "Star Alliance", ["BKK"]),
    ("MH", "MAS", "Malaysia Airlines", "Malaysia", "MALAYSIAN", 85, "Oneworld", ["KUL"]),
    ("GA", "GIA", "Garuda Indonesia", "Indonesia", "INDONESIA", 75, "SkyTeam", ["CGK"]),
    ("KE", "KAL", "Korean Air", "South Korea", "KOREAN AIR", 160, "SkyTeam", ["ICN"]),
    ("OZ", "AAR", "Asiana Airlines", "South Korea", "ASIANA", 80, "Star Alliance", ["ICN"]),
    ("BR", "EVA", "EVA Air", "Taiwan", "EVA", 88, "Star Alliance", ["TPE"]),
    ("CI", "CAL", "China Airlines", "Taiwan", "DYNASTY", 85, "SkyTeam", ["TPE"]),
    ("CZ", "CSN", "China Southern Airlines", "China", "CHINA SOUTHERN", 650, "None", ["CAN", "PKX"]),
    ("MU", "CES", "China Eastern Airlines", "China", "CHINA EASTERN", 600, "SkyTeam", ["PVG", "SHA"]),
    ("CA", "CCA", "Air China", "China", "AIR CHINA", 490, "Star Alliance", ["PEK", "PVG"]),
    ("B6", "JBU", "JetBlue Airways", "United States", "JETBLUE", 290, "None", ["JFK", "BOS", "MCO"]),
    ("AS", "ASA", "Alaska Airlines", "United States", "ALASKA", 310, "Oneworld", ["SEA", "PDX", "SFO", "LAX"]),
    ("NK", "NKS", "Spirit Airlines", "United States", "SPIRIT WINGS", 205, "None", ["FLL", "MCO", "LAS"]),
    ("LX", "SWR", "Swiss International Air Lines", "Switzerland", "SWISS", 90, "Star Alliance", ["ZRH", "GVA"]),
    ("OS", "AUA", "Austrian Airlines", "Austria", "AUSTRIAN", 65, "Star Alliance", ["VIE"]),
    ("TP", "TAP", "TAP Air Portugal", "Portugal", "AIR PORTUGAL", 100, "Star Alliance", ["LIS"]),
]

assert len(AIRLINES_RAW) == 50, f"Expected 50 airlines, got {len(AIRLINES_RAW)}"

AIRLINES = []
for al in AIRLINES_RAW:
    AIRLINES.append({
        "iata_code": al[0],
        "icao_code": al[1],
        "name": al[2],
        "country": al[3],
        "callsign": al[4],
        "fleet_size": al[5],
        "alliance": al[6],
        "hub_airports": al[7],
    })

# -------------------------------------------------------------
# 3. 20 REALISTIC AIRCRAFT TYPES
# -------------------------------------------------------------
AIRCRAFT_TYPES = [
    {"model": "Boeing 737-800", "manufacturer": "Boeing", "category": "Narrow-body", "seating_capacity": 189, "cruise_speed_kmh": 840, "max_range_km": 5765, "engines": 2, "fuel_rate_kg_hr": 2500},
    {"model": "Boeing 737 MAX 8", "manufacturer": "Boeing", "category": "Narrow-body", "seating_capacity": 178, "cruise_speed_kmh": 839, "max_range_km": 6570, "engines": 2, "fuel_rate_kg_hr": 2200},
    {"model": "Boeing 777-300ER", "manufacturer": "Boeing", "category": "Wide-body", "seating_capacity": 396, "cruise_speed_kmh": 905, "max_range_km": 13650, "engines": 2, "fuel_rate_kg_hr": 7500},
    {"model": "Boeing 787-9 Dreamliner", "manufacturer": "Boeing", "category": "Wide-body", "seating_capacity": 296, "cruise_speed_kmh": 903, "max_range_km": 14140, "engines": 2, "fuel_rate_kg_hr": 5400},
    {"model": "Boeing 787-10 Dreamliner", "manufacturer": "Boeing", "category": "Wide-body", "seating_capacity": 336, "cruise_speed_kmh": 903, "max_range_km": 11730, "engines": 2, "fuel_rate_kg_hr": 5800},
    {"model": "Boeing 767-300ER", "manufacturer": "Boeing", "category": "Wide-body", "seating_capacity": 269, "cruise_speed_kmh": 850, "max_range_km": 11070, "engines": 2, "fuel_rate_kg_hr": 4800},
    {"model": "Boeing 747-8 Intercontinental", "manufacturer": "Boeing", "category": "Wide-body", "seating_capacity": 467, "cruise_speed_kmh": 917, "max_range_km": 14320, "engines": 4, "fuel_rate_kg_hr": 10100},
    {"model": "Airbus A320neo", "manufacturer": "Airbus", "category": "Narrow-body", "seating_capacity": 180, "cruise_speed_kmh": 828, "max_range_km": 6500, "engines": 2, "fuel_rate_kg_hr": 2150},
    {"model": "Airbus A321neo", "manufacturer": "Airbus", "category": "Narrow-body", "seating_capacity": 220, "cruise_speed_kmh": 833, "max_range_km": 7400, "engines": 2, "fuel_rate_kg_hr": 2400},
    {"model": "Airbus A330-300", "manufacturer": "Airbus", "category": "Wide-body", "seating_capacity": 300, "cruise_speed_kmh": 871, "max_range_km": 11750, "engines": 2, "fuel_rate_kg_hr": 5700},
    {"model": "Airbus A330-900neo", "manufacturer": "Airbus", "category": "Wide-body", "seating_capacity": 310, "cruise_speed_kmh": 880, "max_range_km": 13334, "engines": 2, "fuel_rate_kg_hr": 5100},
    {"model": "Airbus A350-900", "manufacturer": "Airbus", "category": "Wide-body", "seating_capacity": 325, "cruise_speed_kmh": 903, "max_range_km": 15000, "engines": 2, "fuel_rate_kg_hr": 5800},
    {"model": "Airbus A350-1000", "manufacturer": "Airbus", "category": "Wide-body", "seating_capacity": 369, "cruise_speed_kmh": 903, "max_range_km": 16100, "engines": 2, "fuel_rate_kg_hr": 6400},
    {"model": "Airbus A380-800", "manufacturer": "Airbus", "category": "Wide-body", "seating_capacity": 525, "cruise_speed_kmh": 903, "max_range_km": 14800, "engines": 4, "fuel_rate_kg_hr": 11500},
    {"model": "Airbus A220-300", "manufacturer": "Airbus", "category": "Narrow-body", "seating_capacity": 140, "cruise_speed_kmh": 829, "max_range_km": 6297, "engines": 2, "fuel_rate_kg_hr": 1700},
    {"model": "Embraer E190-E2", "manufacturer": "Embraer", "category": "Regional Jet", "seating_capacity": 104, "cruise_speed_kmh": 820, "max_range_km": 5300, "engines": 2, "fuel_rate_kg_hr": 1500},
    {"model": "Embraer E195-E2", "manufacturer": "Embraer", "category": "Regional Jet", "seating_capacity": 132, "cruise_speed_kmh": 835, "max_range_km": 4815, "engines": 2, "fuel_rate_kg_hr": 1750},
    {"model": "Bombardier CRJ-900", "manufacturer": "Bombardier", "category": "Regional Jet", "seating_capacity": 90, "cruise_speed_kmh": 830, "max_range_km": 2876, "engines": 2, "fuel_rate_kg_hr": 1400},
    {"model": "ATR 72-600", "manufacturer": "ATR", "category": "Turboprop", "seating_capacity": 70, "cruise_speed_kmh": 510, "max_range_km": 1528, "engines": 2, "fuel_rate_kg_hr": 650},
    {"model": "Airbus A319neo", "manufacturer": "Airbus", "category": "Narrow-body", "seating_capacity": 140, "cruise_speed_kmh": 828, "max_range_km": 6850, "engines": 2, "fuel_rate_kg_hr": 1900},
]

assert len(AIRCRAFT_TYPES) == 20, f"Expected 20 aircraft types, got {len(AIRCRAFT_TYPES)}"

# -------------------------------------------------------------
# 4. HAVERSINE DISTANCE HELPER
# -------------------------------------------------------------
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

# Lookup maps
AIRPORT_MAP = {a["iata_code"]: a for a in AIRPORTS}
AIRLINE_MAP = {al["iata_code"]: al for al in AIRLINES}

# -------------------------------------------------------------
# 5. GENERATE 50,000 FLIGHT RECORDS
# -------------------------------------------------------------
TOTAL_FLIGHTS = 50000

# Base time anchor for realism: 2026-10-28 (current project time)
# Generating flights across a 180-day window (approx May 2026 to Nov 2026)
REFERENCE_NOW = datetime(2026, 10, 28, 12, 0, 0, tzinfo=timezone.utc)
START_WINDOW = REFERENCE_NOW - timedelta(days=150)
END_WINDOW = REFERENCE_NOW + timedelta(days=30)
TOTAL_WINDOW_SECONDS = int((END_WINDOW - START_WINDOW).total_seconds())

print(f"Generating {TOTAL_FLIGHTS} flights across timeframe {START_WINDOW.date()} to {END_WINDOW.date()}...")

DELAY_REASON_CHOICES = ["carrier", "weather", "nas", "security", "late_aircraft"]

flights = []

# Prepare weighted airport choices (Hubs have more traffic)
HUB_CODES = ["ATL", "ORD", "DFW", "DEN", "LHR", "DXB", "HND", "CDG", "AMS", "FRA", "SIN", "DEL", "JFK", "LAX"]
AIRPORT_CODES = list(AIRPORT_MAP.keys())
AIRLINE_CODES = list(AIRLINE_MAP.keys())

for idx in range(1, TOTAL_FLIGHTS + 1):
    airline_code = random.choice(AIRLINE_CODES)
    airline = AIRLINE_MAP[airline_code]

    # Select origin: 60% chance to pick from airline hubs if available
    hubs = airline.get("hub_airports", [])
    valid_hubs = [h for h in hubs if h in AIRPORT_MAP]
    if valid_hubs and random.random() < 0.65:
        origin_code = random.choice(valid_hubs)
    else:
        origin_code = random.choice(AIRPORT_CODES)

    # Select destination: must be different from origin
    dest_candidates = [c for c in AIRPORT_CODES if c != origin_code]
    # Bias destination towards major hubs
    if random.random() < 0.4:
        hub_candidates = [c for c in HUB_CODES if c != origin_code and c in AIRPORT_MAP]
        dest_code = random.choice(hub_candidates) if hub_candidates else random.choice(dest_candidates)
    else:
        dest_code = random.choice(dest_candidates)

    origin = AIRPORT_MAP[origin_code]
    dest = AIRPORT_MAP[dest_code]

    dist_km = haversine_km(origin["latitude"], origin["longitude"], dest["latitude"], dest["longitude"])
    if dist_km < 150:
        dist_km = 200.0 # minimum reasonable commercial route

    # Filter suitable aircraft by range
    suitable_aircraft = [ac for ac in AIRCRAFT_TYPES if ac["max_range_km"] >= dist_km]
    if not suitable_aircraft:
        suitable_aircraft = [ac for ac in AIRCRAFT_TYPES if ac["category"] == "Wide-body"]
    aircraft = random.choice(suitable_aircraft)

    # Calculate flight duration (taxi + airborne)
    taxi_minutes = random.randint(20, 35)
    cruise_speed = aircraft["cruise_speed_kmh"]
    airborne_minutes = int((dist_km / cruise_speed) * 60)
    scheduled_duration_minutes = taxi_minutes + airborne_minutes

    # Flight number
    flight_number = f"{airline_code}{random.randint(100, 9999)}"

    # Scheduled departure timestamp
    random_offset_seconds = random.randint(0, TOTAL_WINDOW_SECONDS)
    sched_dep = START_WINDOW + timedelta(seconds=random_offset_seconds)
    sched_arr = sched_dep + timedelta(minutes=scheduled_duration_minutes)

    # Determine flight lifecycle status relative to REFERENCE_NOW
    time_diff_to_now = (sched_dep - REFERENCE_NOW).total_seconds()

    # Determine status & delays
    dep_delay_minutes = 0
    arr_delay_minutes = 0
    delay_breakdown = {
        "carrier_delay": 0,
        "weather_delay": 0,
        "nas_delay": 0,
        "security_delay": 0,
        "late_aircraft_delay": 0
    }

    rand_status_roll = random.random()

    if time_diff_to_now > 1800:
        # Future flight: Scheduled
        status = "Scheduled"
        actual_dep = None
        actual_arr = None
    elif -scheduled_duration_minutes * 60 <= time_diff_to_now <= 1800:
        # Currently within flight window: En Route!
        status = "En Route"
        dep_delay_minutes = random.choice([0, 0, 0, random.randint(5, 45)])
        actual_dep = sched_dep + timedelta(minutes=dep_delay_minutes)
        actual_arr = None
    else:
        # Past flight: can be Landed, Delayed, Cancelled, or Diverted
        if rand_status_roll < 0.025:
            # Cancelled (2.5%)
            status = "Cancelled"
            actual_dep = None
            actual_arr = None
            dep_delay_minutes = 0
            arr_delay_minutes = 0
            # Cancel reason
            prime_reason = random.choice(["weather", "carrier", "nas"])
            delay_breakdown[f"{prime_reason}_delay"] = 120
        elif rand_status_roll < 0.035:
            # Diverted (1.0%)
            status = "Diverted"
            dep_delay_minutes = random.randint(10, 80)
            actual_dep = sched_dep + timedelta(minutes=dep_delay_minutes)
            arr_delay_minutes = dep_delay_minutes + random.randint(40, 180)
            actual_arr = sched_arr + timedelta(minutes=arr_delay_minutes)
            prime_reason = random.choice(["weather", "carrier"])
            delay_breakdown[f"{prime_reason}_delay"] = arr_delay_minutes
        elif rand_status_roll < 0.225:
            # Significant Delay (19.0%)
            status = "Delayed"
            # Realistic positive skew delay: 16 to 240 mins
            dep_delay_minutes = int(random.expovariate(1 / 35.0) + 16)
            dep_delay_minutes = min(dep_delay_minutes, 360)
            arr_delay_minutes = max(0, dep_delay_minutes + random.randint(-15, 25))
            actual_dep = sched_dep + timedelta(minutes=dep_delay_minutes)
            actual_arr = sched_arr + timedelta(minutes=arr_delay_minutes)

            # Attribute delay breakdown
            remaining = dep_delay_minutes
            reasons = random.sample(DELAY_REASON_CHOICES, k=random.randint(1, 3))
            for i, r in enumerate(reasons):
                if i == len(reasons) - 1 or remaining <= 1:
                    part = remaining
                    remaining = 0
                else:
                    part = random.randint(1, max(1, remaining - 1))
                    remaining -= part
                delay_breakdown[f"{r}_delay"] = max(0, part)
        else:
            # On-time / Minor (77.5%)
            status = "Landed"
            # Small departure variance: -10 min early to +14 min late
            dep_delay_minutes = random.randint(-10, 14)
            arr_delay_minutes = dep_delay_minutes + random.randint(-12, 10)
            actual_dep = sched_dep + timedelta(minutes=dep_delay_minutes)
            actual_arr = sched_arr + timedelta(minutes=arr_delay_minutes)

    # Passengers and load factor
    load_factor = random.uniform(0.68, 0.98)
    passengers = int(aircraft["seating_capacity"] * load_factor) if status != "Cancelled" else 0

    # Fuel burn calculation (kg)
    flight_hours = scheduled_duration_minutes / 60.0
    fuel_burn_kg = round(flight_hours * aircraft["fuel_rate_kg_hr"] * (0.88 + load_factor * 0.24), 1) if status != "Cancelled" else 0.0

    flight_doc = {
        "flight_number": flight_number,
        "airline": {
            "iata_code": airline["iata_code"],
            "name": airline["name"],
            "country": airline["country"],
            "alliance": airline["alliance"]
        },
        "aircraft": {
            "model": aircraft["model"],
            "manufacturer": aircraft["manufacturer"],
            "category": aircraft["category"],
            "capacity": aircraft["seating_capacity"]
        },
        "origin_airport": {
            "iata_code": origin["iata_code"],
            "name": origin["name"],
            "city": origin["city"],
            "country": origin["country"],
            "latitude": origin["latitude"],
            "longitude": origin["longitude"],
            "timezone": origin["timezone"]
        },
        "destination_airport": {
            "iata_code": dest["iata_code"],
            "name": dest["name"],
            "city": dest["city"],
            "country": dest["country"],
            "latitude": dest["latitude"],
            "longitude": dest["longitude"],
            "timezone": dest["timezone"]
        },
        "scheduled_departure": sched_dep.isoformat(),
        "scheduled_arrival": sched_arr.isoformat(),
        "actual_departure": actual_dep.isoformat() if actual_dep else None,
        "actual_arrival": actual_arr.isoformat() if actual_arr else None,
        "status": status,
        "departure_delay_minutes": dep_delay_minutes,
        "arrival_delay_minutes": arr_delay_minutes,
        "delays": delay_breakdown,
        "distance_km": dist_km,
        "flight_duration_minutes": scheduled_duration_minutes,
        "passenger_count": passengers,
        "fuel_burn_kg": fuel_burn_kg,
        "terminal": f"T{random.randint(1, 5)}",
        "gate": f"{chr(random.randint(65, 75))}{random.randint(1, 40)}"
    }
    flights.append(flight_doc)

print(f"Generated {len(flights)} flight records.")

# -------------------------------------------------------------
# 6. WRITE DATASET FILES TO data/generated/
# -------------------------------------------------------------
with open(os.path.join(OUTPUT_DIR, "airports.json"), "w", encoding="utf-8") as f:
    json.dump(AIRPORTS, f, indent=2)

with open(os.path.join(OUTPUT_DIR, "airlines.json"), "w", encoding="utf-8") as f:
    json.dump(AIRLINES, f, indent=2)

with open(os.path.join(OUTPUT_DIR, "aircraft_types.json"), "w", encoding="utf-8") as f:
    json.dump(AIRCRAFT_TYPES, f, indent=2)

with open(os.path.join(OUTPUT_DIR, "flights.json"), "w", encoding="utf-8") as f:
    json.dump(flights, f, indent=2)

# Summarize dataset statistics
status_counts = {}
for fl in flights:
    s = fl["status"]
    status_counts[s] = status_counts.get(s, 0) + 1

summary = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "random_seed": SEED,
    "counts": {
        "airports": len(AIRPORTS),
        "airlines": len(AIRLINES),
        "aircraft_types": len(AIRCRAFT_TYPES),
        "flights": len(flights)
    },
    "flight_status_breakdown": status_counts,
    "timeframe": {
        "start": START_WINDOW.isoformat(),
        "end": END_WINDOW.isoformat()
    }
}

with open(os.path.join(OUTPUT_DIR, "summary.json"), "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

print("Dataset generation complete. Summary:")
print(json.dumps(summary, indent=2))
