import pymysql
pymysql.install_as_MySQLdb()

# Podrabiamy wersję, żeby bramkarz Django nas wpuścił XD
import MySQLdb
MySQLdb.version_info = (2, 2, 1, 'final', 0)