
toshl_Y = load('../dataset/toshl.txt');
toggl_Y = load('../dataset/toggl.txt');

m = length(toshl_Y);
theta = zeros(2,1);

averaged = imfilter(toshl_Y, fspecial('average', [7 1]));
averaged = imfilter(averaged2, fspecial('average', [7 1]));

plot(toshl_Y, '-b', averaged, '-r')
axis([0 366])

%X = [ones(m,1), (1:1:m)'];

%theta = gradientDescent(X, averaged2, theta, 0.01, 100);

%plot(X(:,2), X*theta, '-y')
