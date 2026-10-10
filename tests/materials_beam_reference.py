def beam(L,P,a,E,I,n=10000):
    b=L-a; RA=P*b/L
    def M(x): return RA*x if x<=a else RA*x-P*(x-a)
    def d(x): return P*b*x*(L*L-b*b-x*x)/(6*L*E*I) if x<=a else P*a*(L-x)*(L*L-a*a-(L-x)**2)/(6*L*E*I)
    xs=[L*i/n for i in range(n+1)]; return P*b/L,P*a/L,max((abs(d(x)),x) for x in xs),M
if __name__=='__main__':
    RA,RB,md,M=beam(4,20000,1,200e9,8e-6);print(RA,RB,md,M(1),M(4))
