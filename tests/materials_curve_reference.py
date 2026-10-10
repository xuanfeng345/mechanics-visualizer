def curve(strains,E,yield_stress,H=0):
    ey=yield_stress/E
    out=[]
    for e in strains:
        if abs(e)<=ey: out.append((e,E*e,'elastic'))
        else:
            p=abs(e)-ey; out.append((e,(1 if e>=0 else -1)*(yield_stress+H*p),'plastic_hardening' if H else 'perfectly_plastic'))
    return out
if __name__=='__main__': print(curve([0,.0005,.0015,-.0015],200000,250,1000))
