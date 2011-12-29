
import SVM
import IO
import Data.List.Split

-- can't quite figure this thing out

learn :: [Double] -> SVMSolution
learn vals =
  let dataSet = DataSet points vals
  let svm = LSSVM (KernelFunction radialKernelFunction) 0.5 0.5


main = do
  lines <- readFile "../dataset/toshl.txt"
  print (learn (map (\x -> read x::Double)
                (splitOn "\r\n" lines)))
