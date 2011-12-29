
function J = linearCost(X, y, Theta)

m = length(y);

J = sum((X*Theta-y).^2)/(2*m);

end
