
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

-- ((n-i)*2)/((n-1)*n)
--weights :: (Fractional a) => Int -> [a]
weights len =
  map (\i -> ((n-i)*2)/((n-1)*n)) [1.0..n]
    where n = len*1.0

expected :: (Fractional a) => [a] -> a
--expected xs = sum $ map (\p -> fst p * snd p) $ zip (weights $ length xs) xs
expected xs = head xs

predict' :: (Fractional a) => Int -> Int -> [a] -> [a]
predict' num now series
  | num-now > 0 = predict' num (now+1) (expected (take width series):series)
  | otherwise = series
  where width = 7+now*2

predict :: (Fractional a) => Int -> [a] -> [a]
predict n series = reverse (predict' n 0 (reverse series))

--main = do
--  lines <- readFile "../dataset/toshl.txt"
--  store (predict (map (\x -> read x::Double)
--                  (splitOn "\r\n" lines)))
