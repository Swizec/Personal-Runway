import Data.Time.Calendar 
import Data.Time.LocalTime
import Data.Colour.Names
import Data.Colour
import Data.Accessor
import Graphics.Rendering.Chart
--import Graphics.Rendering.Chart.Gtk
import Prices

date dd mm yyyy = (LocalTime (fromGregorian (fromIntegral yyyy) mm dd) midnight)
ok y = (y == 2005) || (y == 2006)

chart = layout 
  where

    price1 = plot_lines_style .> line_color ^= opaque blue
           $ plot_lines_values ^= [[ ((date d m y), v) | (d,m,y,v,_) <- prices, ok y]]
           $ plot_lines_title ^= "price 1"
           $ defaultPlotLines

    price2 = plot_lines_style .> line_color ^= opaque green
           $ plot_lines_values ^= [[ ((date d m y), v) | (d,m,y,_,v) <- prices, ok y]]
           $ plot_lines_title ^= "price 2"
           $ defaultPlotLines

    layout = layout1_title ^="Price History"
           $ layout1_left_axis ^: laxis_override ^= axisGridHide
           $ layout1_right_axis ^: laxis_override ^= axisGridHide
           $ layout1_bottom_axis ^: laxis_override ^= axisGridHide
           $ layout1_plots ^= [Left (toPlot price1),
                               Right (toPlot price2)]
           $ layout1_grid_last ^= False
           $ defaultLayout1

main = do
--    renderableToWindow (toRenderable chart) 640 480
    renderableToPNGFile (toRenderable chart) 640 480 "test2.png"
