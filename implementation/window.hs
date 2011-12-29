
import Data.List.Split

smooth' :: (Fractional a) => [a] -> [a]
smooth' [] = []
smooth' (x:xs) =
  (sum w)/fromIntegral (length w):smooth' xs
    where w = x:(take 3 xs)

smooth :: (Fractional a) => [a] -> [a]
smooth xs = reverse (smooth' (reverse xs))

store :: (Fractional a) => [a] -> IO ()
store xs = writeFile "../dataset/toshl_predict.txt"
           (foldr (\x acc -> x++"\r\n"++acc) "" (map show xs))

expected :: (Fractional a) => [a] -> a
expected xs = sum (map (* 0.25) xs)

predict' :: (Fractional a) => [a] -> [a]
predict' xs
  | length xs <= width = [expected xs]
  | otherwise          = (expected (take width xs)):predict' (tail xs)
    where width = 5

predict :: (Fractional a) => [a] -> [a]
predict xs = predict' (smooth xs)

--main = do
--  lines <- readFile "../dataset/toshl.txt"
--  store (predict (map (\x -> read x::Double)
--                  (splitOn "\r\n" lines)))
