
import SVM
import IO
import Data.List.Split


main = do
  lines <- readFile "../dataset/toshl.txt"
  print (map (\x -> read x::Float)
         (splitOn "\r\n" lines))
