from dateutil import parser
from datetime import datetime
dt = parser.parse("Mon May 17 2021")
print(dt.year, dt.month, dt.day,dt.hour, dt.minute, dt.second)

day_of_year = dt.timetuple().tm_yday
print(day_of_year)

print(datetime(2021, 1, 1).weekday())