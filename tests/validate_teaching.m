% Independent statics checks for the teaching playground (SI units).
W=20; L=2;
x=[1,1.5,2,1]; theta=[90,90,90,30];
F=(W*L/2)./(x.*sind(theta));
Rx=-F.*cosd(theta); Ry=W-F.*sind(theta);
M=x.*F.*sind(theta)-W*L/2;
assert(max(abs(M))<1e-10);
assert(max(abs(Rx+F.*cosd(theta)))<1e-10);
assert(max(abs(Ry+F.*sind(theta)-W))<1e-10);
assert(abs(F(2)-40/3)<1e-10);
assert(abs(F(4)-40)<1e-10);
% No hinge: zero moment alone does not ensure equilibrium.
assert(abs(M(3))<1e-10 && abs(F(3)-W)>1);
disp(table(x',theta',F',Rx',Ry',M','VariableNames',{'x_m','theta_deg','F_N','Rx_N','Ry_N','M_Nm'}));
disp('TEACHING_STATICS_PASS');
