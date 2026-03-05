-- Enable Realtime for readings and devices tables
ALTER PUBLICATION supabase_realtime ADD TABLE readings;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
